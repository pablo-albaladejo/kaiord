/**
 * Create Step Action
 *
 * Action for creating a new workout step with default values.
 */

import type { KRD } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

export const createStepAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout;
  const newStepIndex = workout.steps.length;

  const newStep = {
    stepIndex: newStepIndex,
    durationType: "open" as const,
    duration: { type: "open" as const },
    targetType: "open" as const,
    target: { type: "open" as const },
  };

  const updatedWorkout = {
    ...workout,
    steps: [...workout.steps, newStep],
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
