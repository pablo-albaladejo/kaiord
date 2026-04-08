import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ping, sendMessage } from "./garmin-extension-transport";

describe("garmin-extension-transport", () => {
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

  describe("sendMessage", () => {
    it("resolves with extension response", async () => {
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        cb({ ok: true, data: "test" });
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await sendMessage("ext-id", { action: "ping" }, 2000);

      expect(result).toEqual({ ok: true, data: "test" });
    });

    it("resolves with error when chrome.runtime is unavailable", async () => {
      delete (globalThis as Record<string, unknown>).chrome;

      const result = await sendMessage("ext-id", { action: "ping" }, 2000);

      expect(result).toEqual({
        ok: false,
        error: "Chrome runtime not available",
      });
    });

    it("resolves with timeout error when no response", async () => {
      const mockSend = vi.fn();
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const promise = sendMessage("ext-id", { action: "ping" }, 2000);
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toEqual({
        ok: false,
        error: "Extension did not respond",
      });
    });

    it("resolves with lastError when extension not found", async () => {
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        (
          globalThis as unknown as {
            chrome: { runtime: { lastError: { message: string } | null } };
          }
        ).chrome.runtime.lastError = {
          message: "Could not establish connection",
        };
        cb(undefined);
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await sendMessage("ext-id", { action: "ping" }, 2000);

      expect(result).toEqual({
        ok: false,
        error: "Could not establish connection",
      });
    });

    it("resolves with error when sendMessage throws", async () => {
      const mockSend = vi.fn(() => {
        throw new Error("fail");
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await sendMessage("ext-id", { action: "ping" }, 2000);

      expect(result).toEqual({
        ok: false,
        error: "Extension not available",
      });
    });
  });

  describe("ping", () => {
    it("returns on first success", async () => {
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        cb({ ok: true, protocolVersion: 1, data: { gcApi: { ok: true } } });
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("retries on timeout", async () => {
      let callCount = 0;
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        callCount++;
        if (callCount === 2) {
          cb({ ok: true, protocolVersion: 1 });
        }
      });
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
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        (
          globalThis as unknown as {
            chrome: { runtime: { lastError: { message: string } | null } };
          }
        ).chrome.runtime.lastError = { message: "Not found" };
        cb(undefined);
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      const result = await ping("ext-id");

      expect(result.ok).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
