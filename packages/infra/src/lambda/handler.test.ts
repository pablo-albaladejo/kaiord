import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./garmin-push", () => ({
  pushToGarmin: vi.fn(),
}));

vi.mock("./proxy-fetch", () => ({
  enableSocksProxy: vi.fn(),
  checkTunnelHealth: vi.fn().mockResolvedValue(true),
}));

const { pushToGarmin } = await import("./garmin-push");
const mockPush = vi.mocked(pushToGarmin);
const { checkTunnelHealth, enableSocksProxy } = await import("./proxy-fetch");
const mockTunnelHealth = vi.mocked(checkTunnelHealth);
const mockEnableSocks = vi.mocked(enableSocksProxy);

const { handler } = await import("./handler");

const validBody = JSON.stringify({
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  },
  garmin: { username: "user@test.com", password: "pass123" },
});

const createEvent = (method: string, path: string, body?: string) =>
  ({
    requestContext: {
      http: { method, path },
      requestId: "test-req-id",
      accountId: "123",
      apiId: "api",
      stage: "$default",
      time: "",
      timeEpoch: 0,
    },
    rawPath: path,
    rawQueryString: "",
    headers: { "content-type": "application/json" },
    isBase64Encoded: false,
    body,
  }) as Parameters<typeof handler>[0];

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  delete process.env.TS_SECRET_API_KEY;
});

describe("Lambda handler (via Hono adapter)", () => {
  it("should return 200 on successful push", async () => {
    mockPush.mockResolvedValueOnce({
      id: "123",
      name: "Test",
      url: "https://connect.garmin.com/modern/workout/123",
    });

    const result = await handler(createEvent("POST", "/push", validBody));

    expect(result.statusCode).toBe(200);
  });

  it("should invoke Tailscale middleware when env var set", async () => {
    process.env.TS_SECRET_API_KEY = "test-secret";
    mockPush.mockResolvedValueOnce({ id: "1", name: "W", url: "u" });

    await handler(createEvent("POST", "/push", validBody));

    expect(mockEnableSocks).toHaveBeenCalled();
    expect(mockTunnelHealth).toHaveBeenCalled();
  });

  it("should return 503 when tunnel health fails", async () => {
    process.env.TS_SECRET_API_KEY = "test-secret";
    mockTunnelHealth.mockResolvedValueOnce(false);

    const result = await handler(createEvent("POST", "/push", validBody));

    expect(result.statusCode).toBe(503);
  });

  it("should not invoke Tailscale without env var", async () => {
    mockPush.mockResolvedValueOnce({ id: "1", name: "W", url: "u" });

    await handler(createEvent("POST", "/push", validBody));

    expect(mockEnableSocks).not.toHaveBeenCalled();
  });

  it("should serve health check regardless of Tailscale", async () => {
    process.env.TS_SECRET_API_KEY = "test-secret";
    mockTunnelHealth.mockResolvedValueOnce(false);

    const result = await handler(createEvent("GET", "/health"));

    expect(result.statusCode).toBe(200);
    expect(mockEnableSocks).not.toHaveBeenCalled();
  });
});
