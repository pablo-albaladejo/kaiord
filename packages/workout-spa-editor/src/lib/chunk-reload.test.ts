import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isChunkLoadError } from "./chunk-reload";

const RELOAD_AT_KEY = "kaiord:chunk-reload-at";

describe("isChunkLoadError", () => {
  it("should match a failed dynamic-import message", () => {
    // Arrange
    const error = new Error(
      "Failed to fetch dynamically imported module: /assets/Today-x.js"
    );

    // Act
    const result = isChunkLoadError(error);

    // Assert
    expect(result).toBe(true);
  });

  it("should not match an unrelated error", () => {
    // Arrange
    const error = new Error("Cannot read properties of undefined");

    // Act
    const result = isChunkLoadError(error);

    // Assert
    expect(result).toBe(false);
  });
});

describe("reloadOnceForChunkError", () => {
  const reload = vi.fn();

  // Fresh module per test so the in-memory `reloadedThisLoad` guard resets.
  const loadFn = async () => {
    vi.resetModules();
    const mod = await import("./chunk-reload");
    return mod.reloadOnceForChunkError;
  };

  beforeEach(() => {
    reload.mockClear();
    sessionStorage.clear();
    vi.stubGlobal("location", { reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should reload when no recent reload is recorded", async () => {
    // Arrange
    const reloadOnceForChunkError = await loadFn();

    // Act
    const triggered = reloadOnceForChunkError();

    // Assert
    expect(triggered).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("should suppress a second reload within the cooldown window", async () => {
    // Arrange
    sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()));
    const reloadOnceForChunkError = await loadFn();

    // Act
    const triggered = reloadOnceForChunkError();

    // Assert
    expect(triggered).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("should reload at most once per load when sessionStorage is unavailable", async () => {
    // Arrange
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      clear: () => undefined,
    });
    const reloadOnceForChunkError = await loadFn();

    // Act
    const first = reloadOnceForChunkError();
    const second = reloadOnceForChunkError();

    // Assert
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
