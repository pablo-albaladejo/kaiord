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
import {
  EXPIRED_LONGER_OFFSET_MS,
  EXPIRED_OFFSET_MS,
  HISTORY_INDEX_EMPTY,
  INTERVAL_SECONDS,
  RECENT_OFFSET_MS,
  RECENT_OLDER_OFFSET_MS,
  REMAINING_BOTH,
  REMAINING_NONE,
  REMAINING_RECENT_ONLY,
  STEP_INDEX_FIRST,
  STEP_INDEX_SECOND,
  WARMUP_SECONDS,
  WATTS_TEMPO,
  WATTS_VO2_MAX,
} from "./clear-expired-deletes-action.test-fixtures";

describe("clearExpiredDeletesAction", () => {
  it("should remove expired deleted steps", () => {
    // Arrange
    const now = Date.now();
    const expiredTimestamp = now - EXPIRED_OFFSET_MS; // 6 seconds ago (expired)
    const recentTimestamp = now - RECENT_OFFSET_MS; // 2 seconds ago (not expired)

    const expiredStep: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_TEMPO },
        },
      } as WorkoutStep,
      index: STEP_INDEX_FIRST,
      timestamp: expiredTimestamp,
    };

    const recentStep: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: INTERVAL_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_VO2_MAX },
        },
      } as WorkoutStep,
      index: STEP_INDEX_SECOND,
      timestamp: recentTimestamp,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      undoHistory: [],
      historyIndex: HISTORY_INDEX_EMPTY,
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
    expect(result.deletedSteps).toHaveLength(REMAINING_RECENT_ONLY);
    expect(result.deletedSteps?.[STEP_INDEX_FIRST]).toEqual(recentStep);
  });

  it("should keep all steps if none are expired", () => {
    // Arrange
    const now = Date.now();
    const recentTimestamp1 = now - RECENT_OFFSET_MS; // 2 seconds ago
    const recentTimestamp2 = now - RECENT_OLDER_OFFSET_MS; // 3 seconds ago

    const step1: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_TEMPO },
        },
      } as WorkoutStep,
      index: STEP_INDEX_FIRST,
      timestamp: recentTimestamp1,
    };

    const step2: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: INTERVAL_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_VO2_MAX },
        },
      } as WorkoutStep,
      index: STEP_INDEX_SECOND,
      timestamp: recentTimestamp2,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      undoHistory: [],
      historyIndex: HISTORY_INDEX_EMPTY,
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
    expect(result.deletedSteps).toHaveLength(REMAINING_BOTH);
  });

  it("should return empty array if all steps are expired", () => {
    // Arrange
    const now = Date.now();
    const expiredTimestamp1 = now - EXPIRED_OFFSET_MS; // 6 seconds ago
    const expiredTimestamp2 = now - EXPIRED_LONGER_OFFSET_MS; // 7 seconds ago

    const step1: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_FIRST,
        durationType: "time",
        duration: { type: "time", seconds: WARMUP_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_TEMPO },
        },
      } as WorkoutStep,
      index: STEP_INDEX_FIRST,
      timestamp: expiredTimestamp1,
    };

    const step2: DeletedStep = {
      step: {
        stepIndex: STEP_INDEX_SECOND,
        durationType: "time",
        duration: { type: "time", seconds: INTERVAL_SECONDS },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: WATTS_VO2_MAX },
        },
      } as WorkoutStep,
      index: STEP_INDEX_SECOND,
      timestamp: expiredTimestamp2,
    };

    const state: WorkoutState = {
      currentWorkout: null,
      undoHistory: [],
      historyIndex: HISTORY_INDEX_EMPTY,
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
    expect(result.deletedSteps).toHaveLength(REMAINING_NONE);
  });
});
