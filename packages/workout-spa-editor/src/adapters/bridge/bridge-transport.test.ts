import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "./bridge-transport";

const TRANSPORT_TIMEOUT_TICK_MS = 1_000;

describe("sendBridgeMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return error when chrome runtime is not available", async () => {
    // Arrange
    const originalChrome = globalThis.chrome;
    delete globalThis.chrome;

    // Act
    const result = await sendBridgeMessage("ext-id", { type: "ping" });

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Chrome runtime not available",
    });
    globalThis.chrome = originalChrome;
  });

  it("should send message via chrome.runtime.sendMessage", async () => {
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

  it("should return error when chrome.runtime.lastError is set", async () => {
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

  it("should return no-response error when callback receives null", async () => {
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

  it("should resolve with timeout error when extension does not respond", async () => {
    // Arrange
    const sendMessage = vi.fn();
    globalThis.chrome = {
      runtime: {
        sendMessage: sendMessage,
        lastError: undefined,
      },
    } as unknown as typeof chrome;
    const promise = sendBridgeMessage(
      "ext-123",
      { type: "ping" },
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

  it("should return error when sendMessage throws", async () => {
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
