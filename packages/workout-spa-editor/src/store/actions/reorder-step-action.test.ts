/**
 * Reorder Step Action Tests
 *
 * Tests for the reorderStepAction function.
 * Requirement 3: Update step indices and reorder workout structure
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { KRD } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { reorderStepAction } from "./reorder-step-action";

describe("reorderStepAction", () => {
  let mockKrd: KRD;
  let mockState: WorkoutState;

  beforeEach(() => {
    mockKrd = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
            },
            {
              stepIndex: 1,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
              targetType: "heart_rate",
              target: {
                type: "heart_rate",
                value: { unit: "bpm", value: 150 },
              },
            },
            {
              stepIndex: 2,
              durationType: "open",
              duration: { type: "open" },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    mockState = {
      currentWorkout: mockKrd,
      workoutHistory: [mockKrd],
      historyIndex: 0,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    };
  });

  describe("basic reordering", () => {
    it("should move step from position 0 to position 2", () => {
      // Arrange
      const activeIndex = 0;
      const overIndex = 2;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(3);

      // Original step 0 (300s) should now be at position 2
      expect(workout?.steps[2].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(workout?.steps[2].stepIndex).toBe(2);

      // Original step 1 (1000m) should now be at position 0
      expect(workout?.steps[0].duration).toEqual({
        type: "distance",
        meters: 1000,
      });
      expect(workout?.steps[0].stepIndex).toBe(0);

      // Original step 2 (open) should now be at position 1
      expect(workout?.steps[1].duration).toEqual({ type: "open" });
      expect(workout?.steps[1].stepIndex).toBe(1);
    });

    it("should move step from position 2 to position 0", () => {
      // Arrange
      const activeIndex = 2;
      const overIndex = 0;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(3);

      // Original step 2 (open) should now be at position 0
      expect(workout?.steps[0].duration).toEqual({ type: "open" });
      expect(workout?.steps[0].stepIndex).toBe(0);

      // Original step 0 (300s) should now be at position 1
      expect(workout?.steps[1].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(workout?.steps[1].stepIndex).toBe(1);

      // Original step 1 (1000m) should now be at position 2
      expect(workout?.steps[2].duration).toEqual({
        type: "distance",
        meters: 1000,
      });
      expect(workout?.steps[2].stepIndex).toBe(2);
    });

    it("should move step from position 1 to position 0", () => {
      // Arrange
      const activeIndex = 1;
      const overIndex = 0;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(3);

      // Original step 1 (1000m) should now be at position 0
      expect(workout?.steps[0].duration).toEqual({
        type: "distance",
        meters: 1000,
      });
      expect(workout?.steps[0].stepIndex).toBe(0);

      // Original step 0 (300s) should now be at position 1
      expect(workout?.steps[1].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(workout?.steps[1].stepIndex).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should return empty object when activeIndex equals overIndex", () => {
      // Arrange
      const activeIndex = 1;
      const overIndex = 1;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when activeIndex is out of bounds (negative)", () => {
      // Arrange
      const activeIndex = -1;
      const overIndex = 1;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when activeIndex is out of bounds (too large)", () => {
      // Arrange
      const activeIndex = 5;
      const overIndex = 1;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when overIndex is out of bounds (negative)", () => {
      // Arrange
      const activeIndex = 1;
      const overIndex = -1;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when overIndex is out of bounds (too large)", () => {
      // Arrange
      const activeIndex = 1;
      const overIndex = 5;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when no workout is present", () => {
      // Arrange
      const krdWithoutWorkout: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };

      // Act
      const result = reorderStepAction(krdWithoutWorkout, 0, 1, mockState);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe("history management", () => {
    it("should add reordered workout to history", () => {
      // Arrange
      const activeIndex = 0;
      const overIndex = 2;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      expect(result.workoutHistory).toHaveLength(2);
      expect(result.historyIndex).toBe(1);
    });

    it("should preserve existing history when reordering", () => {
      // Arrange
      const stateWithHistory: WorkoutState = {
        ...mockState,
        workoutHistory: [mockKrd, mockKrd],
        historyIndex: 1,
      };

      // Act
      const result = reorderStepAction(mockKrd, 0, 1, stateWithHistory);

      // Assert
      expect(result.workoutHistory).toHaveLength(3);
      expect(result.historyIndex).toBe(2);
    });
  });

  describe("step index recalculation", () => {
    it("should recalculate all step indices after reordering", () => {
      // Arrange
      const activeIndex = 0;
      const overIndex = 2;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[1].stepIndex).toBe(1);
      expect(workout?.steps[2].stepIndex).toBe(2);
    });

    it("should maintain correct step indices for all steps", () => {
      // Arrange
      const activeIndex = 2;
      const overIndex = 0;

      // Act
      const result = reorderStepAction(
        mockKrd,
        activeIndex,
        overIndex,
        mockState
      );

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      for (let i = 0; i < workout!.steps.length; i++) {
        expect(workout?.steps[i].stepIndex).toBe(i);
      }
    });
  });

  describe("repetition blocks", () => {
    it("should handle reordering with repetition blocks", () => {
      // Arrange
      const krdWithBlock: KRD = {
        ...mockKrd,
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
              {
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 60 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 250 },
                    },
                  },
                ],
              },
              {
                stepIndex: 1,
                durationType: "open",
                duration: { type: "open" },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      // Act
      const result = reorderStepAction(krdWithBlock, 0, 2, mockState);

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(3);

      // Repetition block should now be at position 0
      expect(workout?.steps[0]).toHaveProperty("repeatCount");

      // Original step 2 should now be at position 1
      expect(workout?.steps[1].duration).toEqual({ type: "open" });
      expect(workout?.steps[1].stepIndex).toBe(1);

      // Original step 0 should now be at position 2
      expect(workout?.steps[2].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(workout?.steps[2].stepIndex).toBe(2);
    });
  });
});
