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

  describe("Property 4: Sequential stepIndex after reorder", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 4: Sequential stepIndex after reorder**
     * **Validates: Requirements 1.3**
     *
     * For any workout after a reorder operation, the stepIndex values SHALL be
     * sequential starting from 0, matching the array positions.
     */
    it("should ensure stepIndex values are sequential after any reorder operation", () => {
      // Arrange - Create workout with various initial stepIndex values
      const krdWithNonSequentialIndices: KRD = {
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
                stepIndex: 5, // Non-sequential initial value
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
              {
                stepIndex: 10, // Non-sequential initial value
                durationType: "distance",
                duration: { type: "distance", meters: 1000 },
                targetType: "heart_rate",
                target: {
                  type: "heart_rate",
                  value: { unit: "bpm", value: 150 },
                },
              },
              {
                stepIndex: 3, // Non-sequential initial value
                durationType: "open",
                duration: { type: "open" },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      // Act - Perform reorder operation (move step from position 0 to position 2)
      const result = reorderStepAction(
        krdWithNonSequentialIndices,
        0,
        2,
        mockState
      );

      // Assert - All stepIndex values should be sequential starting from 0
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(3);

      // Verify each step has stepIndex matching its array position
      for (let i = 0; i < workout!.steps.length; i++) {
        const step = workout!.steps[i];
        if ("stepIndex" in step) {
          expect(step.stepIndex).toBe(i);
        }
      }

      // Explicitly verify the sequence
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[1].stepIndex).toBe(1);
      expect(workout?.steps[2].stepIndex).toBe(2);
    });

    it("should maintain sequential stepIndex for workouts with repetition blocks", () => {
      // Arrange - Create workout with steps and repetition blocks
      const krdWithMixedItems: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            name: "Mixed Workout",
            sport: "cycling",
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
                      value: { unit: "watts", value: 300 },
                    },
                  },
                ],
              },
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 180 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
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

      // Act - Reorder: move repetition block from position 1 to position 3
      const result = reorderStepAction(krdWithMixedItems, 1, 3, mockState);

      // Assert - All WorkoutStep items should have sequential stepIndex based on their array position
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(4);

      // After reorder, the array is: [step0, step1, step2, block]
      // The reindexSteps function assigns stepIndex based on array position
      // So: step0 gets stepIndex=0, step1 gets stepIndex=1, step2 gets stepIndex=2
      expect(workout?.steps[0].stepIndex).toBe(0); // First step at position 0
      expect(workout?.steps[1].stepIndex).toBe(1); // Second step at position 1
      expect(workout?.steps[2].stepIndex).toBe(2); // Third step at position 2
      // Position 3 is RepetitionBlock (no stepIndex property)
      expect(workout?.steps[3]).toHaveProperty("repeatCount");
    });

    it("should ensure sequential stepIndex after multiple reorder operations", () => {
      // Arrange - Start with a workout
      const initialKrd: KRD = {
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
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 250 },
                },
              },
              {
                stepIndex: 3,
                durationType: "open",
                duration: { type: "open" },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      // Act - Perform first reorder (move 0 to 2)
      const result1 = reorderStepAction(initialKrd, 0, 2, mockState);
      const krd1 = result1.currentWorkout!;

      // Verify sequential after first reorder
      let workout = krd1.extensions?.workout;
      for (let i = 0; i < workout!.steps.length; i++) {
        expect(workout!.steps[i].stepIndex).toBe(i);
      }

      // Act - Perform second reorder (move 3 to 0)
      const result2 = reorderStepAction(krd1, 3, 0, mockState);
      const krd2 = result2.currentWorkout!;

      // Verify sequential after second reorder
      workout = krd2.extensions?.workout;
      for (let i = 0; i < workout!.steps.length; i++) {
        expect(workout!.steps[i].stepIndex).toBe(i);
      }

      // Act - Perform third reorder (move 1 to 2)
      const result3 = reorderStepAction(krd2, 1, 2, mockState);
      const krd3 = result3.currentWorkout!;

      // Assert - Final state should still have sequential stepIndex
      workout = krd3.extensions?.workout;
      expect(workout?.steps).toHaveLength(4);

      for (let i = 0; i < workout!.steps.length; i++) {
        expect(workout!.steps[i].stepIndex).toBe(i);
      }
    });

    it("should handle edge case of single step workout", () => {
      // Arrange - Workout with single step
      const singleStepKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Single Step",
            sport: "running",
            steps: [
              {
                stepIndex: 99, // Arbitrary initial value
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          },
        },
      };

      // Act - Attempt reorder (should be no-op since same position)
      const result = reorderStepAction(singleStepKrd, 0, 0, mockState);

      // Assert - Should return empty object (no change)
      expect(result).toEqual({});
    });

    it("should ensure sequential stepIndex for large workouts", () => {
      // Arrange - Create workout with many steps
      const largeWorkoutSteps = Array.from({ length: 20 }, (_, i) => ({
        stepIndex: i * 5, // Non-sequential initial values
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 },
        targetType: "power" as const,
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 200 },
        },
      }));

      const largeKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Large Workout",
            sport: "running",
            steps: largeWorkoutSteps,
          },
        },
      };

      // Act - Reorder: move first step to last position
      const result = reorderStepAction(largeKrd, 0, 19, mockState);

      // Assert - All stepIndex values should be sequential
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(20);

      for (let i = 0; i < workout!.steps.length; i++) {
        expect(workout!.steps[i].stepIndex).toBe(i);
      }
    });
  });
});
