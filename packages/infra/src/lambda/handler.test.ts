import { describe, it, expect, vi } from "vitest";
import { handler } from "./handler";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("./garmin-push", () => ({
  pushToGarmin: vi.fn(),
}));

vi.mock("./proxy-fetch", () => ({
  enableSocksProxy: vi.fn(),
  checkTunnelHealth: vi.fn().mockResolvedValue(true),
}));

vi.mock("./tailscale-exit-node", () => ({
  ensureExitNode: vi.fn().mockResolvedValue(undefined),
}));

const { pushToGarmin } = await import("./garmin-push");
const mockPush = vi.mocked(pushToGarmin);
const { checkTunnelHealth } = await import("./proxy-fetch");
const mockTunnelHealth = vi.mocked(checkTunnelHealth);

const createEvent = (body?: string): APIGatewayProxyEventV2 =>
  ({
    body,
    requestContext: { requestId: "test-req-id" },
  }) as unknown as APIGatewayProxyEventV2;

const validBody = JSON.stringify({
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  },
  garmin: { username: "user@test.com", password: "pass123" },
});

describe("Lambda handler", () => {
  it("should return 400 when body is missing", async () => {
    const result = await handler(createEvent(undefined));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).error).toBe(
      "Request body is required"
    );
  });

  it("should return 400 when body is invalid JSON", async () => {
    const result = await handler(createEvent("not json"));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).error).toBe(
      "Invalid JSON in request body"
    );
  });

  it("should return 400 when schema validation fails", async () => {
    const result = await handler(
      createEvent(JSON.stringify({ krd: {}, garmin: {} }))
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).error).toContain(
      "Invalid request"
    );
  });

  it("should return 200 with push result on success", async () => {
    mockPush.mockResolvedValueOnce({
      id: "123",
      name: "Test Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    });

    const result = await handler(createEvent(validBody));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.id).toBe("123");
    expect(body.name).toBe("Test Workout");
    expect(body.url).toContain("connect.garmin.com");
  });

  it("should return 401 on authentication error", async () => {
    mockPush.mockRejectedValueOnce(new Error("Login failed: ticket not found"));

    const result = await handler(createEvent(validBody));

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body as string).error).toBe(
      "Garmin authentication failed"
    );
  });

  it("should return 401 on account locked error", async () => {
    mockPush.mockRejectedValueOnce(new Error("Account locked"));

    const result = await handler(createEvent(validBody));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 on generic Garmin error", async () => {
    mockPush.mockRejectedValueOnce(new Error("Connection timeout"));

    const result = await handler(createEvent(validBody));

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body as string).error).toBe("Garmin API error");
  });

  it("should return 413 when payload exceeds 512 KB", async () => {
    const largeBody = "x".repeat(512_001);

    const result = await handler(createEvent(largeBody));

    expect(result.statusCode).toBe(413);
    expect(JSON.parse(result.body as string).error).toBe("Payload too large");
  });

  it("should log requestId and errorType without sensitive data", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPush.mockRejectedValueOnce(new TypeError("Connection timeout"));

    await handler(createEvent(validBody));

    expect(consoleSpy).toHaveBeenCalledWith("Garmin push failed", {
      requestId: "test-req-id",
      errorType: "TypeError",
      errorMessage: "Connection timeout".slice(0, 100),
    });
    consoleSpy.mockRestore();
  });

  it("should return 429 on Garmin rate limit error", async () => {
    mockPush.mockRejectedValueOnce(
      new Error("OAuth1 token request failed: 429 Too Many Requests")
    );

    const result = await handler(createEvent(validBody));

    expect(result.statusCode).toBe(429);
    expect(JSON.parse(result.body as string).error).toBe(
      "Garmin rate limited, try again later"
    );
  });

  it("should return 503 when tunnel health check fails", async () => {
    process.env.TS_SECRET_API_KEY = "test-secret";
    try {
      mockTunnelHealth.mockResolvedValueOnce(false);

      const result = await handler(createEvent(validBody));

      expect(result.statusCode).toBe(503);
      expect(JSON.parse(result.body as string).error).toBe(
        "Proxy tunnel unavailable"
      );
    } finally {
      delete process.env.TS_SECRET_API_KEY;
    }
  });

  it("should return 400 for invalid body even when tunnel is down", async () => {
    process.env.TS_SECRET_API_KEY = "test-secret";
    try {
      mockTunnelHealth.mockResolvedValueOnce(false);

      const result = await handler(createEvent("not json"));

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string).error).toBe(
        "Invalid JSON in request body"
      );
    } finally {
      delete process.env.TS_SECRET_API_KEY;
    }
  });

  it("should not leak credentials in error responses", async () => {
    mockPush.mockRejectedValueOnce(new Error("Some error with pass123"));

    const result = await handler(createEvent(validBody));
    const body = result.body as string;

    expect(body).not.toContain("user@test.com");
    expect(body).not.toContain("pass123");
  });
});
