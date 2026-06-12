/**
 * Delete Step Action
 *
 * Action for deleting a workout step and recalculating indices.
 * Tracks deleted steps for undo functionality.
 */

import type { KRD } from "../../types/krd";
import type { UIWorkoutItem } from "../../types/krd-ui";
import { nextAfterDelete } from "../focus-rules";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { extractStructuredWorkout } from "./_helpers/extract-workout";
import {
  filterSteps,
  findStepToDelete,
  reindexSteps,
} from "./delete-step-helpers";

export const deleteStepAction = (
  krd: KRD,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) {
    return {};
  }

  const found = findStepToDelete(workout, stepIndex);
  const updatedSteps = filterSteps(workout.steps, stepIndex);
  const reindexedSteps = reindexSteps(updatedSteps);

  const updatedWorkout = { ...workout, steps: reindexedSteps };
  const updatedKrd: KRD = {
    ...krd,
    extensions: { ...krd.extensions, structured_workout: updatedWorkout },
  };

  const deletedSteps = state.deletedSteps || [];
  // Runtime invariant: `state.currentWorkout` is a UIWorkout, so the
  // deleted item already carries its stable ItemId that the domain
  // `Workout` type does not surface — re-assert it here so the undo
  // trail stays on the UIWorkoutItem contract.
  const newDeletedSteps = found
    ? [
        ...deletedSteps,
        {
          step: found.step as UIWorkoutItem,
          index: stepIndex,
          timestamp: Date.now(),
        },
      ]
    : deletedSteps;

  // Compute focus intent: where should the user's focus land post-delete?
  const pendingFocusTarget = found
    ? nextAfterDelete({
        workout: updatedWorkout,
        deletedIndex: found.arrayIndex,
      })
    : state.pendingFocusTarget;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    deletedSteps: newDeletedSteps,
    pendingFocusTarget,
  };
};
