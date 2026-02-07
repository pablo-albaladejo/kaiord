/**
 * Undo Delete Action Tests
 *
 * Tests for the undo delete action.
 */

import { describe, expect, it } from "vitest";
import type { KRD, WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import type { DeletedStep } from "../workout-store-types";
import { undoDeleteAction } from "./undo-delete-action";

describe("undoDeleteAction", () => {
  it("should restore deleted step at original position", () => {
    // Arrange
    const deletedStep: WorkoutStep = {
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 },
      },
    };

    const timestamp = Date.now();
    const deletedStepEntry: DeletedStep = {
      step: deletedStep,
      index: 1,
      timestamp,
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
      deletedSteps: [deletedStepEntry],
    };

    // Act
    const result = undoDeleteAction(krd, timestamp, state);

    // Assert
    expect(result.currentWorkout).toBeDefined();
    const workout = result.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(3);
    expect(workout?.steps[1]).toEqual({
      ...deletedStep,
      stepIndex: 1,
    });
    expect(result.deletedSteps).toHaveLength(0);
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
    const result = undoDeleteAction(krd, Date.now(), state);

    // Assert
    expect(result).toEqual({});
  });

  it("should return empty object if timestamp not found", () => {
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
          steps: [],
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
    const result = undoDeleteAction(krd, Date.now(), state);

    // Assert
    expect(result).toEqual({});
  });

  it("should recalculate step indices after restore", () => {
    // Arrange
    const deletedStep: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 },
      },
    };

    const timestamp = Date.now();
    const deletedStepEntry: DeletedStep = {
      step: deletedStep,
      index: 0,
      timestamp,
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
      deletedSteps: [deletedStepEntry],
    };

    // Act
    const result = undoDeleteAction(krd, timestamp, state);

    // Assert
    const workout = result.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);
    expect(workout?.steps[0].stepIndex).toBe(0);
    expect(workout?.steps[1].stepIndex).toBe(1);
  });
});
