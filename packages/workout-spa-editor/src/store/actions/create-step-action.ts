/**
 * Create Step Action
 *
 * Action for creating a new workout step with default values.
 *
 * A workout starts with a warm-up, so the first step is one; every later
 * step is active work until the user says otherwise. No name is stored: the
 * card labels an unnamed step in the user's language ("Step 2" / "Paso 2").
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
    intensity: newStepIndex === 0 ? "warmup" : "active",
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
