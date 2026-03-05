import { describe, it, expect, vi } from "vitest";
import { handler } from "./handler";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("./garmin-push", () => ({
  pushToGarmin: vi.fn(),
}));

const { pushToGarmin } = await import("./garmin-push");
const mockPush = vi.mocked(pushToGarmin);

const createEvent = (body?: string): APIGatewayProxyEventV2 =>
  ({ body }) as APIGatewayProxyEventV2;

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

  it("should not leak credentials in error responses", async () => {
    mockPush.mockRejectedValueOnce(new Error("Some error with pass123"));

    const result = await handler(createEvent(validBody));
    const body = result.body as string;

    expect(body).not.toContain("user@test.com");
    expect(body).not.toContain("pass123");
  });
});
