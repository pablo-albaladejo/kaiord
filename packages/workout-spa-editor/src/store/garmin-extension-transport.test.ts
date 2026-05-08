import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ping, sendMessage } from "./garmin-extension-transport";

const TRANSPORT_TIMEOUT_TICK_MS = 2000;

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
    it("should resolve with extension response", async () => {
      // Arrange
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        cb({ ok: true, data: "test" });
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      // Act
      const result = await sendMessage(
        "ext-id",
        { action: "ping" },
        TRANSPORT_TIMEOUT_TICK_MS
      );

      // Assert
      expect(result).toEqual({ ok: true, data: "test" });
    });

    it("should resolve with error when chrome.runtime is unavailable", async () => {
      // Arrange
      delete (globalThis as Record<string, unknown>).chrome;

      // Act
      const result = await sendMessage(
        "ext-id",
        { action: "ping" },
        TRANSPORT_TIMEOUT_TICK_MS
      );

      // Assert
      expect(result).toEqual({
        ok: false,
        error: "Chrome runtime not available",
      });
    });

    it("should resolve with timeout error when no response", async () => {
      // Arrange
      const mockSend = vi.fn();
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };
      const promise = sendMessage(
        "ext-id",
        { action: "ping" },
        TRANSPORT_TIMEOUT_TICK_MS
      );
      vi.advanceTimersByTime(TRANSPORT_TIMEOUT_TICK_MS);

      // Act
      const result = await promise;

      // Assert
      expect(result).toEqual({
        ok: false,
        error: "Extension did not respond",
      });
    });

    it("should resolve with lastError when extension not found", async () => {
      // Arrange
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

      // Act
      const result = await sendMessage(
        "ext-id",
        { action: "ping" },
        TRANSPORT_TIMEOUT_TICK_MS
      );

      // Assert
      expect(result).toEqual({
        ok: false,
        error: "Could not establish connection",
      });
    });

    it("should resolve with error when sendMessage throws", async () => {
      // Arrange
      const mockSend = vi.fn(() => {
        throw new Error("fail");
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      // Act
      const result = await sendMessage(
        "ext-id",
        { action: "ping" },
        TRANSPORT_TIMEOUT_TICK_MS
      );

      // Assert
      expect(result).toEqual({
        ok: false,
        error: "Extension not available",
      });
    });
  });

  describe("ping", () => {
    it("should return on first success", async () => {
      // Arrange
      const mockSend = vi.fn((_id, _msg, cb: (r: unknown) => void) => {
        cb({ ok: true, protocolVersion: 1, data: { gcApi: { ok: true } } });
      });
      (globalThis as Record<string, unknown>).chrome = {
        runtime: { lastError: null, sendMessage: mockSend },
      };

      // Act
      const result = await ping("ext-id");

      // Assert
      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should retry on timeout", async () => {
      // Arrange
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
      vi.advanceTimersByTime(TRANSPORT_TIMEOUT_TICK_MS);
      await vi.advanceTimersByTimeAsync(100);

      // Act
      const result = await promise;

      // Assert
      expect(result.ok).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should not retry on lastError", async () => {
      // Arrange
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

      // Act
      const result = await ping("ext-id");

      // Assert
      expect(result.ok).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
