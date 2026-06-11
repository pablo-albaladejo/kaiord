/**
 * useDeleteCleanup Hook Tests
 *
 * Tests for the delete cleanup hook.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as store from "../store";
import { useDeleteCleanup } from "./use-delete-cleanup";

const THREE_INTERVAL_TICKS_MS = 3_000;
const TWO_INTERVAL_TICKS_MS = 2_000;
const THREE_INTERVAL_TICKS_COUNT = 3;
const TWO_INTERVAL_TICKS_COUNT = 2;

vi.mock("../store", () => ({
  useClearExpiredDeletes: vi.fn(),
}));

describe("useDeleteCleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should call clearExpiredDeletes every second", () => {
    // Arrange
    const mockClearExpiredDeletes = vi.fn();
    vi.mocked(store.useClearExpiredDeletes).mockReturnValue(
      mockClearExpiredDeletes
    );
    renderHook(() => useDeleteCleanup());

    // Act
    vi.advanceTimersByTime(THREE_INTERVAL_TICKS_MS);

    // Assert
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(
      THREE_INTERVAL_TICKS_COUNT
    );
  });

  it("should cleanup interval on unmount", () => {
    // Arrange
    const mockClearExpiredDeletes = vi.fn();
    vi.mocked(store.useClearExpiredDeletes).mockReturnValue(
      mockClearExpiredDeletes
    );
    const { unmount } = renderHook(() => useDeleteCleanup());
    vi.advanceTimersByTime(TWO_INTERVAL_TICKS_MS);
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(
      TWO_INTERVAL_TICKS_COUNT
    );
    unmount();

    // Act
    vi.advanceTimersByTime(TWO_INTERVAL_TICKS_MS);

    // Assert
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(
      TWO_INTERVAL_TICKS_COUNT
    );
  });
});
