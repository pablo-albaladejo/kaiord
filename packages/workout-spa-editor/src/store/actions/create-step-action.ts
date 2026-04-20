/**
 * Create Step Action
 *
 * Action for creating a new workout step with default values.
 */

import type { KRD, Workout } from "../../types/krd";
import { defaultIdProvider } from "../providers/id-provider";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

export const createStepAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.structured_workout) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
  const newStepIndex = workout.steps.length;

  const newStep = {
    id: defaultIdProvider(),
    stepIndex: newStepIndex,
    name: `Step ${newStepIndex + 1}`,
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
      structured_workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
