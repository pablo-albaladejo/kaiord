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
    renderHook(() => useDeleteCleanup());

    // Act
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
    const { unmount } = renderHook(() => useDeleteCleanup());
    vi.advanceTimersByTime(2000);
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(2);
    unmount();

    // Act
    vi.advanceTimersByTime(2000);

    // Assert
    expect(mockClearExpiredDeletes).toHaveBeenCalledTimes(2);
  });
});
