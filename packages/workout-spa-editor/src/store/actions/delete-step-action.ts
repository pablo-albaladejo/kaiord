/**
 * Delete Step Action
 *
 * Action for deleting a workout step and recalculating indices.
 */

import type { KRD } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

export const deleteStepAction = (
  krd: KRD,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout;

  // Remove the step at the specified index
  const updatedSteps = workout.steps.filter(
    (step) => step.stepIndex !== stepIndex
  );

  // Recalculate stepIndex for all subsequent steps
  const reindexedSteps = updatedSteps.map((step, index) => ({
    ...step,
    stepIndex: index,
  }));

  const updatedWorkout = {
    ...workout,
    steps: reindexedSteps,
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
