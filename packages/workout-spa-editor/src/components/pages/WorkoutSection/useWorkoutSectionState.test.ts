/**
 * useWorkoutSectionState Hook Tests
 *
 * Tests for the useWorkoutSectionState hook that manages workout section state.
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD, Workout } from "../../../types/krd";
import { useWorkoutSectionState } from "./useWorkoutSectionState";

// Mock the store selectors
vi.mock("../../../store/workout-store-selectors", () => ({
  useCreateStep: vi.fn(() => vi.fn()),
  useDeleteStep: vi.fn(() => vi.fn()),
  useUndoDelete: vi.fn(() => vi.fn()),
  useDuplicateStep: vi.fn(() => vi.fn()),
  useIsEditing: vi.fn(() => false),
  useReorderStep: vi.fn(() => vi.fn()),
  useToggleStepSelection: vi.fn(() => vi.fn()),
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

// Mock other hooks
vi.mock("./use-repetition-block-handlers", () => ({
  useRepetitionBlockHandlers: vi.fn(() => ({
    selectedStepIds: [],
    showCreateBlockDialog: false,
    handleCreateRepetitionBlock: vi.fn(),
    handleCreateEmptyRepetitionBlock: vi.fn(),
    handleConfirmCreateBlock: vi.fn(),
    handleCancelCreateBlock: vi.fn(),
    handleEditRepetitionBlock: vi.fn(),
    handleAddStepToRepetitionBlock: vi.fn(),
    handleUngroup: vi.fn(),
    handleDelete: vi.fn(),
    handleDuplicateStepInRepetitionBlock: vi.fn(),
  })),
}));

vi.mock("./useCopyStep", () => ({
  useCopyStep: vi.fn(() => vi.fn()),
}));

vi.mock("./usePasteStep", () => ({
  usePasteStep: vi.fn(() => vi.fn()),
}));

vi.mock("./useSelectedStep", () => ({
  useSelectedStep: vi.fn(() => null),
}));

vi.mock("./useWorkoutSectionHandlers", () => ({
  useWorkoutSectionHandlers: vi.fn(() => ({
    handleStepSelect: vi.fn(),
    handleSave: vi.fn(),
    handleCancel: vi.fn(),
  })),
}));

describe("useWorkoutSectionState", () => {
  const mockWorkout: Workout = {
    name: "Test Workout",
    sport: "running",
    steps: [
      {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "open",
        target: { type: "open" },
      },
    ],
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteStep function", () => {
    it("should return deleteStep function from store", async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useWorkoutSectionState(
          mockWorkout,
          mockKrd,
          null,
          mockOnStepSelect,
          undefined,
          undefined
        )
      );

      // Assert
      expect(result.current.deleteStep).toBeDefined();
      expect(typeof result.current.deleteStep).toBe("function");
    });

    it("should call deleteStep with correct step index", async () => {
      // Arrange
      const mockDeleteStep = vi.fn();
      const mockToast = vi.fn();
      const { useDeleteStep } = await import(
        "../../../store/workout-store-selectors"
      );
      const { useToastContext } = await import(
        "../../../contexts/ToastContext"
      );
      const { useWorkoutStore } = await import("../../../store/workout-store");

      vi.mocked(useDeleteStep).mockReturnValue(mockDeleteStep);
      vi.mocked(useToastContext).mockReturnValue({
        toast: mockToast,
        toasts: [],
        dismiss: vi.fn(),
      });

      // Mock the store to return a deleted step with timestamp
      vi.mocked(useWorkoutStore.getState).mockReturnValue({
        deletedSteps: [
          {
            step: mockWorkout.steps[0],
            index: 0,
            timestamp: Date.now(),
          },
        ],
      } as any);

      const { result } = renderHook(() =>
        useWorkoutSectionState(
          mockWorkout,
          mockKrd,
          null,
          mockOnStepSelect,
          undefined,
          undefined
        )
      );

      // Act
      result.current.deleteStep(0);

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
});
