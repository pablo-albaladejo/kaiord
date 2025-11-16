/**
 * Delete Step Action
 *
 * Action for deleting a workout step and recalculating indices.
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
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

  const workout = krd.extensions.workout as Workout;

  // Remove the step at the specified index
  const updatedSteps = workout.steps.filter(
    (step: WorkoutStep | RepetitionBlock) => {
      if (isWorkoutStep(step)) {
        return step.stepIndex !== stepIndex;
      }
      return true; // Keep repetition blocks
    }
  );

  // Recalculate stepIndex for all steps
  const reindexedSteps = updatedSteps.map(
    (step: WorkoutStep | RepetitionBlock, index: number) => {
      if (isWorkoutStep(step)) {
        return {
          ...step,
          stepIndex: index,
        };
      }
      return step; // Repetition blocks don't have stepIndex
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
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
