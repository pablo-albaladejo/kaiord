/**
 * Clear Expired Deletes Action Tests
 *
 * Tests for the clear expired deletes action.
 */

import { describe, expect, it } from "vitest";
import type { WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import type { DeletedStep } from "../workout-store-types";
import { clearExpiredDeletesAction } from "./clear-expired-deletes-action";

describe("clearExpiredDeletesAction", () => {
  it("should remove expired deleted steps", () => {
    // Arrange
    const now = Date.now();
    const expiredTimestamp = now - 6000; // 6 seconds ago (expired)
    const recentTimestamp = now - 2000; // 2 seconds ago (not expired)

    const expiredStep: DeletedStep = {
      step: {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      } as WorkoutStep,
      index: 0,
      timestamp: expiredTimestamp,
    };

    const recentStep: DeletedStep = {
      step: {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 360 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 250 },
        },
      } as WorkoutStep,
      index: 1,
      timestamp: recentTimestamp,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [expiredStep, recentStep],
    };

    // Act
    const result = clearExpiredDeletesAction(state);

    // Assert
    expect(result.deletedSteps).toHaveLength(1);
    expect(result.deletedSteps?.[0]).toEqual(recentStep);
  });

  it("should keep all steps if none are expired", () => {
    // Arrange
    const now = Date.now();
    const recentTimestamp1 = now - 2000; // 2 seconds ago
    const recentTimestamp2 = now - 3000; // 3 seconds ago

    const step1: DeletedStep = {
      step: {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      } as WorkoutStep,
      index: 0,
      timestamp: recentTimestamp1,
    };

    const step2: DeletedStep = {
      step: {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 360 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 250 },
        },
      } as WorkoutStep,
      index: 1,
      timestamp: recentTimestamp2,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [step1, step2],
    };

    // Act
    const result = clearExpiredDeletesAction(state);

    // Assert
    expect(result.deletedSteps).toHaveLength(2);
  });

  it("should return empty array if all steps are expired", () => {
    // Arrange
    const now = Date.now();
    const expiredTimestamp1 = now - 6000; // 6 seconds ago
    const expiredTimestamp2 = now - 7000; // 7 seconds ago

    const step1: DeletedStep = {
      step: {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      } as WorkoutStep,
      index: 0,
      timestamp: expiredTimestamp1,
    };

    const step2: DeletedStep = {
      step: {
        stepIndex: 1,
        durationType: "time",
        duration: { type: "time", seconds: 360 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 250 },
        },
      } as WorkoutStep,
      index: 1,
      timestamp: expiredTimestamp2,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [step1, step2],
    };

    // Act
    const result = clearExpiredDeletesAction(state);

    // Assert
    expect(result.deletedSteps).toHaveLength(0);
  });
});
