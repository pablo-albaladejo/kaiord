import { describe, it, expect, beforeEach } from "vitest";

const { isAllowed, handleGarminFetch } = require("../content.js");

const onMessageCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

describe("content.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("onMessage listener", () => {
    it("returns true for garmin-fetch action (async response)", () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      const sendResponse = vi.fn();

      const result = onMessageCb(
        {
          action: "garmin-fetch",
          path: "/workout-service/workouts",
          method: "GET",
        },
        {},
        sendResponse,
      );

      expect(result).toBe(true);
    });

    it("calls sendResponse with fetch result", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ workoutId: 1 }]),
      });
      const sendResponse = vi.fn();

      onMessageCb(
        {
          action: "garmin-fetch",
          path: "/workout-service/workouts",
          method: "GET",
        },
        {},
        sendResponse,
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        status: 200,
        data: [{ workoutId: 1 }],
      });
    });

    it("ignores non-garmin-fetch messages", () => {
      const sendResponse = vi.fn();

      const result = onMessageCb({ action: "other" }, {}, sendResponse);

      expect(result).toBeUndefined();
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe("isAllowed", () => {
    it("allows GET /workout-service/workouts", () => {
      expect(isAllowed("GET", "/workout-service/workouts")).toBe(true);
    });

    it("allows GET /workout-service/workouts with query params", () => {
      expect(
        isAllowed("GET", "/workout-service/workouts?start=0&limit=20")
      ).toBe(true);
    });

    it("allows POST /workout-service/workout", () => {
      expect(isAllowed("POST", "/workout-service/workout")).toBe(true);
    });

    it("rejects DELETE /workout-service/workout/123", () => {
      expect(isAllowed("DELETE", "/workout-service/workout/123")).toBe(false);
    });

    it("rejects GET /userprofile-service/usersettings", () => {
      expect(isAllowed("GET", "/userprofile-service/usersettings")).toBe(false);
    });

    it("rejects POST /workout-service/workouts", () => {
      expect(isAllowed("POST", "/workout-service/workouts")).toBe(false);
    });

    it("rejects GET /workout-service/workout (singular without POST)", () => {
      expect(isAllowed("GET", "/workout-service/workout")).toBe(false);
    });
  });

  describe("handleGarminFetch", () => {
    it("rejects disallowed path", async () => {
      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/userprofile-service/usersettings",
        method: "GET",
      });

      expect(result).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects disallowed method", async () => {
      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workout/123",
        method: "DELETE",
      });

      expect(result).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
    });

    it("executes allowed GET request", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ workoutId: 1 }]),
      });

      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts?start=0&limit=20",
        method: "GET",
        csrfToken: "csrf-123",
      });

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: [{ workoutId: 1 }],
      });
      expect(fetch).toHaveBeenCalledWith(
        "/gc-api/workout-service/workouts?start=0&limit=20",
        expect.objectContaining({
          method: "GET",
          credentials: "include",
          headers: expect.objectContaining({
            nk: "NT",
            "connect-csrf-token": "csrf-123",
          }),
        })
      );
    });

    it("executes allowed POST with body", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ workoutId: 42 }),
      });

      const body = { workoutName: "Test" };
      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workout",
        method: "POST",
        body,
        csrfToken: "csrf-123",
      });

      expect(result).toEqual({
        ok: true,
        status: 200,
        data: { workoutId: 42 },
      });
      expect(fetch).toHaveBeenCalledWith(
        "/gc-api/workout-service/workout",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("handles non-2xx response", async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      });

      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts",
        method: "GET",
      });

      expect(result).toEqual({
        ok: false,
        status: 403,
        body: "Forbidden",
      });
    });

    it("handles 204 No Content", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts",
        method: "GET",
      });

      expect(result).toEqual({
        ok: true,
        status: 204,
        data: null,
      });
    });

    it("handles network error", async () => {
      fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts",
        method: "GET",
      });

      expect(result).toEqual({
        ok: false,
        error: "Failed to fetch",
      });
    });

    it("handles abort/timeout", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      fetch.mockRejectedValue(abortError);

      const result = await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts",
        method: "GET",
      });

      expect(result).toEqual({
        ok: false,
        error: "Request timed out",
      });
    });

    it("omits CSRF header when token is null", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await handleGarminFetch({
        action: "garmin-fetch",
        path: "/workout-service/workouts",
        method: "GET",
        csrfToken: null,
      });

      const callHeaders = fetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty("connect-csrf-token");
    });
  });
});
