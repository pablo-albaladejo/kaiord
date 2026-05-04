import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  openTrain2Go,
  ping,
  readDay,
  readWeek,
} from "./train2go-extension-transport";

describe("train2go-extension-transport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null as { message: string } | null,
        sendMessage: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as Record<string, unknown>).chrome;
  });

  describe("ping (Train2GoPingResult)", () => {
    it("should return sessionActive on first success", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({
            ok: true,
            protocolVersion: 1,
            data: { sessionActive: true, userId: 28035, userName: "Pablo" },
          });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(true);
      expect(result.sessionActive).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should stringify userId at the boundary (lossless capture)", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({
            ok: true,
            protocolVersion: 1,
            data: { sessionActive: true, userId: 28035, userName: "Pablo" },
          });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.externalUserId).toBe("28035");
      expect(typeof result.externalUserId).toBe("string");
      expect(result.externalUserName).toBe("Pablo");
    });

    it("should pass through string userIds verbatim (no double-stringify)", async () => {
      const giant = "9999999999999999";
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({
            ok: true,
            protocolVersion: 1,
            data: { sessionActive: true, userId: giant, userName: "Pablo" },
          });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.externalUserId).toBe(giant);
    });

    it("should retry on timeout", async () => {
      let callCount = 0;
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          callCount++;
          if (callCount === 2) {
            cb({ ok: true, data: { sessionActive: true } });
          }
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const promise = ping("ext-id");
      vi.advanceTimersByTime(2000);
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should return ok:false with error when chrome is unavailable", async () => {
      delete (globalThis as Record<string, unknown>).chrome;

      const result = await ping("ext-id");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Chrome runtime not available");
      expect(result.sessionActive).toBe(false);
      expect(result.externalUserId).toBeNull();
    });

    it("should not retry on lastError", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          (
            globalThis as unknown as {
              chrome: { runtime: { lastError: { message: string } | null } };
            }
          ).chrome.runtime.lastError = { message: "Not found" };
          cb(undefined);
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("readWeek", () => {
    it("should send read-week with stringified userId", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true, data: { activities: [{ id: 1 }] } });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await readWeek("ext-id", "2026-04-13", "28035");

      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        "ext-id",
        { action: "read-week", date: "2026-04-13", userId: "28035" },
        expect.any(Function)
      );
    });

    it("should resolve with timeout on no response", async () => {
      const mockSend = vi.fn();
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const promise = readWeek("ext-id", "2026-04-13", "42");
      vi.advanceTimersByTime(35_000);
      const result = await promise;

      expect(result).toEqual({ ok: false, error: "Extension did not respond" });
    });
  });

  describe("readDay", () => {
    it("should send read-day with stringified userId", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true, data: { activities: [{ id: 2 }] } });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await readDay("ext-id", "2026-04-13", "42");

      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        "ext-id",
        { action: "read-day", date: "2026-04-13", userId: "42" },
        expect.any(Function)
      );
    });
  });

  describe("openTrain2Go", () => {
    it("should send open-train2go action", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await openTrain2Go("ext-id");

      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        "ext-id",
        { action: "open-train2go" },
        expect.any(Function)
      );
    });
  });

  describe("sendMessage edge cases", () => {
    it("should resolve ping with ok:false when sendMessage throws", async () => {
      const mockSend = vi.fn(() => {
        throw new Error("fail");
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Extension not available");
    });

    it("should resolve ping with No response when callback gets null", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb(null);
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(false);
      expect(result.error).toBe("No response");
    });
  });
});
