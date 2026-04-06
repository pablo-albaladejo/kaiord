import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MiddlewareHandler } from "hono";

vi.mock("./garmin-push", () => ({
  pushToGarmin: vi.fn(),
}));

const { pushToGarmin } = await import("./garmin-push");
const mockPush = vi.mocked(pushToGarmin);

const { createApp } = await import("./app");

const validBody = {
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  },
  garmin: { username: "user@test.com", password: "pass123" },
};

const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => vi.clearAllMocks());

describe("GET /health", () => {
  it("should return 200 with status ok", async () => {
    const app = createApp();

    const res = await app.request("/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ status: "ok" });
  });

  it("should return 200 even when onBeforePush would block", async () => {
    const blocking: MiddlewareHandler = async (c) =>
      c.json({ error: "blocked" }, 503);
    const app = createApp({ onBeforePush: blocking });

    const res = await app.request("/health");

    expect(res.status).toBe(200);
  });
});

describe("POST / — validation", () => {
  it("should return 400 when schema validation fails", async () => {
    const app = createApp();

    const res = await post(app, { krd: {}, garmin: {} });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Invalid request");
  });

  it("should return 413 when payload exceeds 512KB", async () => {
    const app = createApp();
    const largeBody = "x".repeat(512_001);

    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: largeBody,
    });

    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("Payload too large");
  });
});

describe("POST / — push success", () => {
  it("should return 200 with push result", async () => {
    mockPush.mockResolvedValueOnce({
      id: "123",
      name: "Test Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    });
    const app = createApp();

    const res = await post(app, validBody);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("123");
    expect(body.url).toContain("connect.garmin.com");
  });
});

describe("POST / — error classification", () => {
  it("should return 401 on auth error", async () => {
    mockPush.mockRejectedValueOnce(new Error("Login failed: ticket not found"));
    const app = createApp();

    const res = await post(app, validBody);

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Garmin authentication failed");
  });

  it("should return 401 on account locked", async () => {
    mockPush.mockRejectedValueOnce(new Error("Account locked"));
    const app = createApp();

    const res = await post(app, validBody);

    expect(res.status).toBe(401);
  });

  it("should return 429 on rate limit", async () => {
    mockPush.mockRejectedValueOnce(
      new Error("OAuth1 token request failed: 429 Too Many Requests")
    );
    const app = createApp();

    const res = await post(app, validBody);

    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe(
      "Garmin rate limited, try again later"
    );
  });

  it("should return 500 on generic error", async () => {
    mockPush.mockRejectedValueOnce(new Error("Connection timeout"));
    const app = createApp();

    const res = await post(app, validBody);

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Garmin API error");
  });

  it("should truncate error messages to 100 chars in logs", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const longMsg = "A".repeat(200);
    mockPush.mockRejectedValueOnce(new Error(longMsg));
    const app = createApp();

    await post(app, validBody);

    expect(spy).toHaveBeenCalledWith(
      "Garmin push failed",
      expect.objectContaining({
        errorMessage: "A".repeat(100),
      })
    );
    spy.mockRestore();
  });

  it("should not leak credentials in error responses", async () => {
    mockPush.mockRejectedValueOnce(new Error("Some error with pass123"));
    const app = createApp();

    const res = await post(app, validBody);
    const text = JSON.stringify(await res.json());

    expect(text).not.toContain("user@test.com");
    expect(text).not.toContain("pass123");
  });
});

describe("POST / — onBeforePush middleware", () => {
  it("should execute before push handler", async () => {
    const order: string[] = [];
    const mw: MiddlewareHandler = async (_c, next) => {
      order.push("middleware");
      return next();
    };
    mockPush.mockImplementation(async () => {
      order.push("push");
      return { id: "1", name: "W", url: "u" };
    });
    const app = createApp({ onBeforePush: mw });

    await post(app, validBody);

    expect(order).toStrictEqual(["middleware", "push"]);
  });

  it("should allow middleware to short-circuit with 503", async () => {
    const mw: MiddlewareHandler = async (c) =>
      c.json({ error: "Proxy tunnel unavailable" }, 503);
    const app = createApp({ onBeforePush: mw });

    const res = await post(app, validBody);

    expect(res.status).toBe(503);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("requestId", () => {
  it("should include X-Request-Id in responses", async () => {
    const app = createApp();

    const res = await app.request("/health");

    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });
});
