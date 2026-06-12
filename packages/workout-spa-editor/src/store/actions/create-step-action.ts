/**
 * Create Step Action
 *
 * Action for creating a new workout step with default values.
 */

import type { KRD, WorkoutStep } from "../../types/krd";
import { createdItemTarget } from "../focus-rules";
import { defaultIdProvider } from "../providers/id-provider";
import type { ItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { extractStructuredWorkout } from "./_helpers/extract-workout";

export const createStepAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) {
    return {};
  }

  const newStepIndex = workout.steps.length;

  const newStep: WorkoutStep & { id: ItemId } = {
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

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    pendingFocusTarget: createdItemTarget(newStep.id),
  };
};
