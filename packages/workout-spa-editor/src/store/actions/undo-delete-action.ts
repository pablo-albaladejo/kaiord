/**
 * Undo Delete Action
 *
 * Action for restoring a deleted step at its original position.
 */

import { isWorkoutStep } from "../../types/krd";
import { createUpdateWorkoutAction } from "../workout-actions";
import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import type { WorkoutState } from "../workout-actions";

export const undoDeleteAction = (
  krd: KRD,
  timestamp: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.structured_workout) {
    return {};
  }

  const deletedSteps = state.deletedSteps || [];
  const deletedStepEntry = deletedSteps.find((d) => d.timestamp === timestamp);

  if (!deletedStepEntry) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
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

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    deletedSteps: newDeletedSteps,
  };
};
