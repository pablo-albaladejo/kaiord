/**
 * Delete Step Action
 *
 * Action for deleting a workout step and recalculating indices.
 * Tracks deleted steps for undo functionality.
 */

import type { KRD, Workout } from "../../types/krd";
import type { UIWorkoutItem } from "../../types/krd-ui";
import { nextAfterDelete } from "../focus-rules";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
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
  if (!krd.extensions?.structured_workout) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
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
  // deleted item already carries its stable ItemId. The `as Workout` cast
  // above erased that at the type level — re-assert it here so the undo
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
