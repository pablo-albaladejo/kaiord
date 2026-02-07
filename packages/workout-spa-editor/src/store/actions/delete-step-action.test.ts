/**
 * Delete Step Action Tests
 *
 * Tests for the delete step action.
 */

import { describe, expect, it } from "vitest";
import type { KRD, WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { deleteStepAction } from "./delete-step-action";

describe("deleteStepAction", () => {
  describe("step deletion tracking", () => {
    it("should track deleted step in deletedSteps array", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
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

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 1, state);

      // Assert
      expect(result.deletedSteps).toBeDefined();
      expect(result.deletedSteps).toHaveLength(1);
      expect(result.deletedSteps?.[0].step).toEqual({
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      });
      expect(result.deletedSteps?.[0].index).toBe(1);
    });

    it("should preserve existing deletedSteps when adding new deletion", () => {
      // Arrange
      const existingDeletedStep: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 120 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 100 },
        },
      };

      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
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

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [
          {
            step: existingDeletedStep,
            index: 0,
            timestamp: Date.now() - 1000,
          },
        ],
      };

      // Act
      const result = deleteStepAction(krd, 1, state);

      // Assert
      expect(result.deletedSteps).toHaveLength(2);
      expect(result.deletedSteps?.[0].step).toEqual(existingDeletedStep);
      expect(result.deletedSteps?.[1].index).toBe(1);
    });
  });

  describe("deletedSteps array updates", () => {
    it("should add deleted step to empty deletedSteps array", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
            ],
          },
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 0, state);

      // Assert
      expect(result.deletedSteps).toHaveLength(1);
      expect(result.deletedSteps?.[0].index).toBe(0);
    });

    it("should not modify deletedSteps if step not found", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
            ],
          },
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 999, state);

      // Assert
      expect(result.deletedSteps).toEqual([]);
    });

    it("should handle undefined deletedSteps in state", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
            ],
          },
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: undefined as unknown as Array<never>,
      };

      // Act
      const result = deleteStepAction(krd, 0, state);

      // Assert
      expect(result.deletedSteps).toBeDefined();
      expect(result.deletedSteps).toHaveLength(1);
    });
  });

  describe("timestamp recording", () => {
    it("should record timestamp when step is deleted", () => {
      // Arrange
      const beforeTimestamp = Date.now();

      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
            ],
          },
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 0, state);
      const afterTimestamp = Date.now();

      // Assert
      expect(result.deletedSteps).toHaveLength(1);
      expect(result.deletedSteps?.[0].timestamp).toBeGreaterThanOrEqual(
        beforeTimestamp
      );
      expect(result.deletedSteps?.[0].timestamp).toBeLessThanOrEqual(
        afterTimestamp
      );
    });

    it("should record different timestamps for multiple deletions", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
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

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act - First deletion
      const result1 = deleteStepAction(krd, 1, state);
      const timestamp1 = result1.deletedSteps?.[0].timestamp;

      // Update state with first deletion
      const stateAfterFirst: WorkoutState = {
        ...state,
        deletedSteps: result1.deletedSteps || [],
      };

      // Act - Second deletion (after small delay to ensure different timestamp)
      const result2 = deleteStepAction(krd, 0, stateAfterFirst);
      const timestamp2 = result2.deletedSteps?.[1].timestamp;

      // Assert
      expect(timestamp1).toBeDefined();
      expect(timestamp2).toBeDefined();
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1!);
    });
  });

  describe("step removal and reindexing", () => {
    it("should remove step from workout", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
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

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 1, state);

      // Assert
      const workout = result.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(1);
      expect(workout?.steps[0].stepIndex).toBe(0);
    });

    it("should recalculate step indices after deletion", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
              {
                stepIndex: 2,
                durationType: "time",
                duration: { type: "time", seconds: 360 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 250 },
                },
              },
            ],
          },
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act - Delete middle step
      const result = deleteStepAction(krd, 1, state);

      // Assert
      const workout = result.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(2);
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[1].stepIndex).toBe(1);
    });

    it("should return empty object if no workout", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
      };

      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
        safeMode: false,
        lastBackup: null,
        deletedSteps: [],
      };

      // Act
      const result = deleteStepAction(krd, 0, state);

      // Assert
      expect(result).toEqual({});
    });
  });
});
