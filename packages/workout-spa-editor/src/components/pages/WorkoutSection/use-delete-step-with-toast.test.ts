/**
 * useDeleteStepWithToast Hook Tests
 *
 * Tests for the hook that wraps step deletion with undo toast.
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteStepWithToast } from "./use-delete-step-with-toast";

// Mock the store selectors
vi.mock("../../../store/workout-store-selectors", () => ({
  useDeleteStep: vi.fn(() => vi.fn()),
  useUndoDelete: vi.fn(() => vi.fn()),
}));

// Mock ToastContext
vi.mock("../../../contexts/ToastContext", () => ({
  useToastContext: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  })),
}));

// Mock WorkoutStore
vi.mock("../../../store/workout-store", () => ({
  useWorkoutStore: {
    getState: vi.fn(() => ({
      deletedSteps: [],
    })),
  },
}));

describe("useDeleteStepWithToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a function", () => {
    // Arrange & Act
    const { result } = renderHook(() => useDeleteStepWithToast());

    // Assert
    expect(typeof result.current).toBe("function");
  });

  it("should call store deleteStep and show toast", async () => {
    // Arrange
    const mockDeleteStep = vi.fn();
    const mockToast = vi.fn();

    const { useDeleteStep } =
      await import("../../../store/workout-store-selectors");
    const { useToastContext } = await import("../../../contexts/ToastContext");
    const { useWorkoutStore } = await import("../../../store/workout-store");

    vi.mocked(useDeleteStep).mockReturnValue(mockDeleteStep);
    vi.mocked(useToastContext).mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    });
    vi.mocked(useWorkoutStore.getState).mockReturnValue({
      deletedSteps: [
        {
          step: {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "open",
            target: { type: "open" },
          },
          index: 0,
          timestamp: Date.now(),
        },
      ],
    } as ReturnType<typeof useWorkoutStore.getState>);

    const { result } = renderHook(() => useDeleteStepWithToast());

    // Act
    result.current(0);

    // Wait for setTimeout to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Assert
    expect(mockDeleteStep).toHaveBeenCalledWith(0);
    expect(mockDeleteStep).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Step deleted",
        variant: "info",
        duration: 5000,
      })
    );
  });
});
