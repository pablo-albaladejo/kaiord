/**
 * Undo Delete Action
 *
 * Action for restoring a deleted step at its original position.
 */

import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import { restoredAfterUndoTarget } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { extractStructuredWorkout } from "./_helpers/extract-workout";

export const undoDeleteAction = (
  krd: KRD,
  timestamp: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) {
    return {};
  }

  const deletedSteps = state.deletedSteps || [];
  const deletedStepEntry = deletedSteps.find((d) => d.timestamp === timestamp);

  if (!deletedStepEntry) {
    return {};
  }

  const { step, index } = deletedStepEntry;

  // Insert the step back at its original position
  const updatedSteps = [...workout.steps];
  updatedSteps.splice(index, 0, step);

  // Recalculate stepIndex for all steps
  const reindexedSteps = updatedSteps.map(
    (s: WorkoutStep | RepetitionBlock, idx: number) => {
      if (isWorkoutStep(s)) {
        return {
          ...s,
          stepIndex: idx,
        };
      }
      return s; // Repetition blocks don't have stepIndex
    }
  );

  const updatedWorkout = {
    ...workout,
    steps: reindexedSteps,
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: updatedWorkout,
    },
  };

  // Remove the deleted step from tracking
  const newDeletedSteps = deletedSteps.filter((d) => d.timestamp !== timestamp);

  // Focus lands on the restored item so the user can immediately
  // continue editing what they just undid.
  const restoredId = (step as { id?: string }).id;
  const pendingFocusTarget = restoredId
    ? restoredAfterUndoTarget(updatedWorkout, restoredId as ItemId)
    : state.pendingFocusTarget;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    deletedSteps: newDeletedSteps,
    pendingFocusTarget,
  };
};
