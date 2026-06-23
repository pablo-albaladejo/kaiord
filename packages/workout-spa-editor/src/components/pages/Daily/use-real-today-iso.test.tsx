import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRealTodayIso } from "./use-real-today-iso";

const PAST_MIDNIGHT_MS = 3000;

describe("useRealTodayIso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return today's local date initially", () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-16T12:00:00"));

    // Act
    const { result } = renderHook(() => useRealTodayIso());

    // Assert
    expect(result.current).toBe("2026-06-16");
  });

  it("should advance to the next day at local midnight while open", () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-16T23:59:59"));
    const { result } = renderHook(() => useRealTodayIso());
    expect(result.current).toBe("2026-06-16");

    // Act
    // Cross midnight; the armed timer fires.
    act(() => {
      vi.advanceTimersByTime(PAST_MIDNIGHT_MS);
    });

    // Assert
    expect(result.current).toBe("2026-06-17");
  });

  it("should re-derive today when the tab regains visibility", () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-16T23:59:59"));
    const { result } = renderHook(() => useRealTodayIso());

    // Act
    // Clock crosses midnight while hidden, then the tab returns.
    act(() => {
      vi.setSystemTime(new Date("2026-06-17T08:00:00"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Assert
    expect(result.current).toBe("2026-06-17");
  });
});
