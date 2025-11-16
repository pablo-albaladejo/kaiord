/**
 * Duplicate Step Action
 *
 * Action for duplicating a workout step and inserting it after the original.
 */

import type { KRD, WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

export const duplicateStepAction = (
  krd: KRD,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout;

  // Find the step to duplicate
  const stepToDuplicate = workout.steps.find(
    (step) => step.stepIndex === stepIndex
  );

  if (!stepToDuplicate) {
    return {};
  }

  // Create a deep clone of the step
  const duplicatedStep: WorkoutStep = JSON.parse(
    JSON.stringify(stepToDuplicate)
  );

  // Insert the duplicated step after the original (at index + 1)
  const updatedSteps = [
    ...workout.steps.slice(0, stepIndex + 1),
    duplicatedStep,
    ...workout.steps.slice(stepIndex + 1),
  ];

  // Recalculate stepIndex for all steps
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
