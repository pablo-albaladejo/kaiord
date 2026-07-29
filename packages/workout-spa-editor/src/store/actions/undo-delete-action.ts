/**
 * Undo Delete Action
 *
 * Restores every step removed by one delete operation, at its original
 * position. The operation is addressed by `groupId` — never by
 * `timestamp`, which collides across same-millisecond deletes.
 */

import type { KRD } from "../../types/krd";
import { restoredAfterUndoTarget } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { extractStructuredWorkout } from "./_helpers/extract-workout";
import { reindexSteps } from "./delete-step-helpers";
import { restoreDeletedItems } from "./undo-delete-helpers";

export const undoDeleteAction = (
  krd: KRD,
  groupId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const deletedSteps = state.deletedSteps || [];
  const group = deletedSteps.filter((d) => d.groupId === groupId);
  if (group.length === 0) return {};

  const updatedWorkout = {
    ...workout,
    steps: reindexSteps(restoreDeletedItems(workout.steps, group)),
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: updatedWorkout,
    },
  };

  // Focus lands on the first restored item so the user can immediately
  // continue editing what they just undid.
  const restoredId = (group[0]!.step as { id?: string }).id;
  const pendingFocusTarget = restoredId
    ? restoredAfterUndoTarget(updatedWorkout, restoredId as ItemId)
    : state.pendingFocusTarget;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    // The whole group is consumed by this one undo.
    deletedSteps: deletedSteps.filter((d) => d.groupId !== groupId),
    pendingFocusTarget,
  };
};
