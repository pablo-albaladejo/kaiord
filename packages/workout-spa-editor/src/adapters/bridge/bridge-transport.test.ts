import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "./bridge-transport";

describe("sendBridgeMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns error when chrome runtime is not available", async () => {
    // Arrange - ensure chrome is undefined
    const originalChrome = globalThis.chrome;
    // @ts-expect-error -- intentionally removing chrome for test
    delete globalThis.chrome;

    // Act
    const result = await sendBridgeMessage("ext-id", { type: "ping" });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Chrome runtime not available",
    });

    // Restore
    globalThis.chrome = originalChrome;
  });

  it("sends message via chrome.runtime.sendMessage", async () => {
    // Arrange
    const mockResponse = { ok: true, protocolVersion: 1 };
    const sendMessage = vi.fn(
      (_extId: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb(mockResponse);
      }
    );

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: undefined,
      },
    } as unknown as typeof chrome;

    // Act
    const result = await sendBridgeMessage("ext-123", { type: "ping" });

    // Assert
    expect(sendMessage).toHaveBeenCalledWith(
      "ext-123",
      { type: "ping" },
      expect.any(Function)
    );
    expect(result).toEqual(mockResponse);
  });

  it("returns error when chrome.runtime.lastError is set", async () => {
    // Arrange
    const sendMessage = vi.fn(
      (_extId: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb(undefined);
      }
    );

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: { message: "Extension not found" },
      },
    } as unknown as typeof chrome;

    // Act
    const result = await sendBridgeMessage("ext-123", { type: "ping" });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Extension not found",
    });
  });

  it("returns no-response error when callback receives null", async () => {
    // Arrange
    const sendMessage = vi.fn(
      (_extId: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb(null);
      }
    );

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: undefined,
      },
    } as unknown as typeof chrome;

    // Act
    const result = await sendBridgeMessage("ext-123", { type: "ping" });

    // Assert
    expect(result).toEqual({ ok: false, error: "No response" });
  });

  it("resolves with timeout error when extension does not respond", async () => {
    // Arrange
    const sendMessage = vi.fn(); // never calls callback

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: undefined,
      },
    } as unknown as typeof chrome;

    // Act
    const promise = sendBridgeMessage("ext-123", { type: "ping" }, 1000);
    vi.advanceTimersByTime(1000);
    const result = await promise;

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Extension did not respond",
    });
  });

  it("returns error when sendMessage throws", async () => {
    // Arrange
    const sendMessage = vi.fn(() => {
      throw new Error("Extension crashed");
    });

    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: undefined,
      },
    } as unknown as typeof chrome;

    // Act
    const result = await sendBridgeMessage("ext-123", { type: "ping" });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Extension not available",
    });
  });
});
