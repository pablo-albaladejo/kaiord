/**
 * useDeleteCleanup Hook Tests
 *
 * Tests for the delete cleanup hook.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as store from "../store";
import { useDeleteCleanup } from "./useDeleteCleanup";

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

    // Act
    renderHook(() => useDeleteCleanup());

    // Fast-forward 3 seconds
    vi.advanceTimersByTime(3000);

    // Assert
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(3);
  });

  it("should cleanup interval on unmount", () => {
    // Arrange
    const mockClearExpiredDeletes = vi.fn();
    vi.mocked(store.useClearExpiredDeletes).mockReturnValue(
      mockClearExpiredDeletes
    );

    // Act
    const { unmount } = renderHook(() => useDeleteCleanup());

    // Fast-forward 2 seconds
    vi.advanceTimersByTime(2000);
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(2);

    // Unmount and advance more time
    unmount();
    vi.advanceTimersByTime(2000);

    // Assert - should not be called after unmount
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(2);
  });
});
