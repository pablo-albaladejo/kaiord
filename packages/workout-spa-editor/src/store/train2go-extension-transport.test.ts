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

  describe("ping", () => {
    it("returns on first success", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true, data: { sessionActive: true, userId: 1 } });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(true);
      expect(result.data?.sessionActive).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("retries on timeout", async () => {
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

    it("does not retry on lastError", async () => {
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

    it("returns error when chrome is unavailable", async () => {
      delete (globalThis as Record<string, unknown>).chrome;

      const result = await ping("ext-id");

      expect(result).toEqual({
        ok: false,
        error: "Chrome runtime not available",
      });
    });
  });

  describe("readWeek", () => {
    it("sends read-week action with date and userId", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true, data: { activities: [{ id: 1 }] } });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await readWeek("ext-id", "2026-04-13", 42);

      expect(result.ok).toBe(true);
      expect(result.data?.activities).toHaveLength(1);
      expect(mockSend).toHaveBeenCalledWith(
        "ext-id",
        { action: "read-week", date: "2026-04-13", userId: 42 },
        expect.any(Function)
      );
    });

    it("resolves with timeout on no response", async () => {
      const mockSend = vi.fn();
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const promise = readWeek("ext-id", "2026-04-13", 42);
      vi.advanceTimersByTime(35_000);
      const result = await promise;

      expect(result).toEqual({ ok: false, error: "Extension did not respond" });
    });
  });

  describe("readDay", () => {
    it("sends read-day action with date and userId", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb({ ok: true, data: { activities: [{ id: 2 }] } });
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await readDay("ext-id", "2026-04-13", 42);

      expect(result.ok).toBe(true);
      expect(result.data?.activities).toHaveLength(1);
      expect(mockSend).toHaveBeenCalledWith(
        "ext-id",
        { action: "read-day", date: "2026-04-13", userId: 42 },
        expect.any(Function)
      );
    });
  });

  describe("openTrain2Go", () => {
    it("sends open-train2go action", async () => {
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
    it("resolves with error when sendMessage throws", async () => {
      const mockSend = vi.fn(() => {
        throw new Error("fail");
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result).toEqual({ ok: false, error: "Extension not available" });
    });

    it("resolves with No response when callback gets null", async () => {
      const mockSend = vi.fn(
        (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
          cb(null);
        }
      );
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result).toEqual({ ok: false, error: "No response" });
    });
  });
});
