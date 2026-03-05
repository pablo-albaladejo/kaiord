import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GarminPushRequest, GarminPushResponse } from "./garmin-push";
import { pushToGarminLambda } from "./garmin-push";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const lambdaUrl = "https://api.kaiord.com/push";
const request: GarminPushRequest = {
  krd: { version: "1.0" } as GarminPushRequest["krd"],
  garmin: { username: "user@test.com", password: "pass123" },
};

describe("pushToGarminLambda", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should send POST request with JSON body and return response", async () => {
    const responseBody: GarminPushResponse = {
      id: "123",
      name: "Test Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseBody),
    });

    const result = await pushToGarminLambda(lambdaUrl, request);

    expect(mockFetch).toHaveBeenCalledWith(lambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    expect(result).toStrictEqual(responseBody);
  });

  it("should throw error with message from response when not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Authentication failed" }),
    });

    await expect(pushToGarminLambda(lambdaUrl, request)).rejects.toThrow(
      "Authentication failed"
    );
  });

  it("should throw HTTP status error when response has no error field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "unexpected" }),
    });

    await expect(pushToGarminLambda(lambdaUrl, request)).rejects.toThrow(
      "HTTP 500"
    );
  });

  it("should propagate fetch network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(pushToGarminLambda(lambdaUrl, request)).rejects.toThrow(
      "Network error"
    );
  });
});
