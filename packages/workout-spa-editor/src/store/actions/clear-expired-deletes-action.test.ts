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

const makeDeletedStep = (index: number, timestamp: number): DeletedStep => ({
  step: {
    stepIndex: index,
    durationType: "time",
    duration: {
      type: "time",
      seconds: index === STEP_INDEX_FIRST ? WARMUP_SECONDS : INTERVAL_SECONDS,
    },
    targetType: "power",
    target: {
      type: "power",
      value: {
        unit: "watts",
        value: index === STEP_INDEX_FIRST ? WATTS_TEMPO : WATTS_VO2_MAX,
      },
    },
  } as WorkoutStep,
  index,
  timestamp,
});

const buildState = (deletedSteps: DeletedStep[]): WorkoutState => ({
  currentWorkout: null,
  undoHistory: [],
  historyIndex: HISTORY_INDEX_EMPTY,
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  safeMode: false,
  lastBackup: null,
  deletedSteps,
});

describe("clearExpiredDeletesAction", () => {
  it.each([
    {
      label: "mixed expired and recent deletes",
      offsets: [EXPIRED_OFFSET_MS, RECENT_OFFSET_MS],
      remaining: REMAINING_RECENT_ONLY,
      survivorIndex: STEP_INDEX_SECOND,
    },
    {
      label: "no expired deletes",
      offsets: [RECENT_OFFSET_MS, RECENT_OLDER_OFFSET_MS],
      remaining: REMAINING_BOTH,
      survivorIndex: null,
    },
    {
      label: "all deletes expired",
      offsets: [EXPIRED_OFFSET_MS, EXPIRED_LONGER_OFFSET_MS],
      remaining: REMAINING_NONE,
      survivorIndex: null,
    },
  ])(
    "should retain only non-expired deletes ($label)",
    ({ offsets, remaining, survivorIndex }) => {
      // Arrange
      const now = Date.now();
      const steps = offsets.map((offset, i) =>
        makeDeletedStep(i, now - offset)
      );
      const state = buildState(steps);

      // Act
      const result = clearExpiredDeletesAction(state);

      // Assert
      expect(result.deletedSteps).toHaveLength(remaining);
      if (survivorIndex !== null) {
        expect(result.deletedSteps?.[STEP_INDEX_FIRST]).toEqual(
          steps[survivorIndex]
        );
      }
    }
  );
});
