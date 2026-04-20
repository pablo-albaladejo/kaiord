/**
 * Delete Step Action
 *
 * Action for deleting a workout step and recalculating indices.
 * Tracks deleted steps for undo functionality.
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { UIWorkoutItem } from "../../types/krd-ui";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

const findStepToDelete = (
  workout: Workout,
  stepIndex: number
): WorkoutStep | RepetitionBlock | null => {
  for (const step of workout.steps) {
    if (isWorkoutStep(step) && step.stepIndex === stepIndex) {
      return step;
    }
  }
  return null;
};

const filterSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  stepIndex: number
): Array<WorkoutStep | RepetitionBlock> => {
  return steps.filter((step: WorkoutStep | RepetitionBlock) => {
    if (isWorkoutStep(step)) {
      return step.stepIndex !== stepIndex;
    }
    return true;
  });
};

const reindexSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  return steps.map((step: WorkoutStep | RepetitionBlock, index: number) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: index };
    }
    return step;
  });
};

export const deleteStepAction = (
  krd: KRD,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.structured_workout) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
  const deletedStep = findStepToDelete(workout, stepIndex);
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
  // trail stays on the UIWorkoutItem contract (CodeRabbit feedback).
  const newDeletedSteps = deletedStep
    ? [
        ...deletedSteps,
        {
          step: deletedStep as UIWorkoutItem,
          index: stepIndex,
          timestamp: Date.now(),
        },
      ]
    : deletedSteps;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    deletedSteps: newDeletedSteps,
  };
};
