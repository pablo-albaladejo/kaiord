import { describe, it, expect, vi } from "vitest";

vi.mock("@kaiord/garmin-connect", () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockPush = vi.fn();

  return {
    createGarminConnectClient: vi.fn(() => ({
      auth: { login: mockLogin, logout: mockLogout },
      service: { push: mockPush },
    })),
    createMemoryTokenStore: vi.fn(() => ({})),
    _mockLogin: mockLogin,
    _mockLogout: mockLogout,
    _mockPush: mockPush,
  };
});

import { pushToGarmin } from "./garmin-push";
import type { KRD } from "@kaiord/core";

const mocks = await import("@kaiord/garmin-connect");
const mockLogin = (mocks as Record<string, ReturnType<typeof vi.fn>>)
  ._mockLogin;
const mockLogout = (mocks as Record<string, ReturnType<typeof vi.fn>>)
  ._mockLogout;
const mockPush = (mocks as Record<string, ReturnType<typeof vi.fn>>)._mockPush;

const fakeKrd = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
} as unknown as KRD;

const credentials = { username: "user@test.com", password: "pass123" };

describe("pushToGarmin", () => {
  it("should login, push, logout and return formatted result", async () => {
    mockPush.mockResolvedValueOnce({
      id: 123,
      name: "Test Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    });

    const result = await pushToGarmin(fakeKrd, credentials);

    expect(mockLogin).toHaveBeenCalledWith("user@test.com", "pass123");
    expect(mockPush).toHaveBeenCalledWith(fakeKrd);
    expect(mockLogout).toHaveBeenCalled();
    expect(result).toStrictEqual({
      id: "123",
      name: "Test Workout",
      url: "https://connect.garmin.com/modern/workout/123",
    });
  });

  it("should generate default URL when result has no url", async () => {
    mockPush.mockResolvedValueOnce({
      id: 456,
      name: "No URL Workout",
      url: undefined,
    });

    const result = await pushToGarmin(fakeKrd, credentials);

    expect(result.url).toBe("https://connect.garmin.com/modern/workout/456");
  });

  it("should convert numeric id to string", async () => {
    mockPush.mockResolvedValueOnce({
      id: 789,
      name: "Workout",
      url: "https://connect.garmin.com/modern/workout/789",
    });

    const result = await pushToGarmin(fakeKrd, credentials);

    expect(result.id).toBe("789");
    expect(typeof result.id).toBe("string");
  });

  it("should propagate login errors", async () => {
    mockLogin.mockRejectedValueOnce(
      new Error("Login failed: ticket not found")
    );

    await expect(pushToGarmin(fakeKrd, credentials)).rejects.toThrow(
      "Login failed: ticket not found"
    );
  });

  it("should propagate push errors", async () => {
    mockPush.mockRejectedValueOnce(new Error("Push failed"));

    await expect(pushToGarmin(fakeKrd, credentials)).rejects.toThrow(
      "Push failed"
    );
  });
});
