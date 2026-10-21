import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useElapsedSeconds } from "./use-elapsed-seconds";

const STARTED_AT = Date.parse("2026-10-17T10:00:00Z");
const THREE_SECONDS_MS = 3_000;
const THREE_SECONDS = 3;

describe("useElapsedSeconds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should count whole seconds since the start", () => {
    // Arrange
    vi.useFakeTimers({ now: STARTED_AT });
    const { result } = renderHook(() => useElapsedSeconds(STARTED_AT));

    // Act
    act(() => vi.advanceTimersByTime(THREE_SECONDS_MS));

    // Assert
    expect(result.current).toBe(THREE_SECONDS);
  });

  it("should clear its interval when unmounted", () => {
    // Arrange
    vi.useFakeTimers({ now: STARTED_AT });
    const { unmount } = renderHook(() => useElapsedSeconds(STARTED_AT));
    const before = vi.getTimerCount();

    // Act
    unmount();

    // Assert
    expect(before).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
