import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { KRD, Workout } from "../../../types/krd";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

// Mock the store selectors
vi.mock("../../../store/workout-store-selectors", () => ({
  useSelectStep: vi.fn(() => vi.fn()),
  useSelectedStepId: vi.fn(() => null),
  useSetEditing: vi.fn(() => vi.fn()),
  useUpdateWorkout: vi.fn(() => vi.fn()),
}));

describe("useWorkoutSectionHandlers", () => {
  const mockWorkout: Workout = {
    name: "Test Workout",
    sport: "running",
    steps: [],
  };

  const mockKrd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: mockWorkout,
    },
  };

  const mockOnStepSelect = vi.fn();

  it("should return only non-delete handlers", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useWorkoutSectionHandlers(mockWorkout, mockKrd, mockOnStepSelect)
    );

    // Assert
    expect(result.current).toHaveProperty("handleStepSelect");
    expect(result.current).toHaveProperty("handleSave");
    expect(result.current).toHaveProperty("handleCancel");
  });

  it("should not include delete-related handlers", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useWorkoutSectionHandlers(mockWorkout, mockKrd, mockOnStepSelect)
    );

    // Assert - Verify no delete handlers exist
    expect(result.current).not.toHaveProperty("handleDeleteRequest");
    expect(result.current).not.toHaveProperty("handleDeleteConfirm");
    expect(result.current).not.toHaveProperty("handleDeleteCancel");
    expect(result.current).not.toHaveProperty("stepToDelete");
  });

  it("should return exactly three handlers", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useWorkoutSectionHandlers(mockWorkout, mockKrd, mockOnStepSelect)
    );

    // Assert
    const handlerKeys = Object.keys(result.current);
    expect(handlerKeys).toHaveLength(3);
    expect(handlerKeys).toEqual([
      "handleStepSelect",
      "handleSave",
      "handleCancel",
    ]);
  });
});
