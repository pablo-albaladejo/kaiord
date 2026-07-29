/**
 * Bulk Delete Steps Action
 *
 * Removes every step addressed by `stepIndices` in one state update:
 * one filter pass, one reindex, ONE history snapshot, and ONE grouped
 * undo entry set. Contrast `deleteStepAction`, which is singular and
 * reindexes after each call — looping it corrupts the target set.
 *
 * Scope: main-list top-level steps only. Nested steps inside a
 * repetition block are addressed by block id, not by `stepIndex`, and
 * are filtered out upstream by the selection guards.
 */

import type { KRD } from "../../types/krd";
import type { UIWorkoutItem } from "../../types/krd-ui";
import { nextAfterMultiDelete } from "../focus-rules";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { extractStructuredWorkout } from "./_helpers/extract-workout";
import { newDeleteGroupId } from "./delete-group-id";
import { reindexSteps } from "./delete-step-helpers";
import { filterOutSteps, findStepsToDelete } from "./delete-steps-helpers";

export const deleteStepsAction = (
  krd: KRD,
  stepIndices: ReadonlyArray<number>,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const found = findStepsToDelete(workout, stepIndices);
  // Nothing addressable — do not touch history, the undo trail, or focus.
  if (found.length === 0) return {};

  const reindexedSteps = reindexSteps(
    filterOutSteps(workout.steps, stepIndices)
  );
  const updatedWorkout = { ...workout, steps: reindexedSteps };
  const updatedKrd: KRD = {
    ...krd,
    extensions: { ...krd.extensions, structured_workout: updatedWorkout },
  };

  // One id for the whole operation, so `undoDelete` restores all of it
  // atomically. `timestamp` stays for the TTL sweep only.
  const groupId = newDeleteGroupId();
  const timestamp = Date.now();
  const newDeletedSteps = [
    ...(state.deletedSteps || []),
    ...found.map((f) => ({
      step: f.step as UIWorkoutItem,
      index: f.arrayIndex,
      timestamp,
      groupId,
    })),
  ];

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    deletedSteps: newDeletedSteps,
    pendingFocusTarget: nextAfterMultiDelete({
      workout: updatedWorkout,
      deletedIndices: found.map((f) => f.arrayIndex),
    }),
    selectedStepId: null,
    selectedStepIds: [],
  };
};
