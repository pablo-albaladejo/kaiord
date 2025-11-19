/**
 * Edit Repetition Block Action
 *
 * Action for updating the repeat count of a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Updates the repeat count of a repetition block at the given index
 *
 * @param krd - Current KRD workout
 * @param blockIndex - Index of the repetition block in the workout steps array
 * @param repeatCount - New repeat count (minimum 1)
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const editRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number,
  repeatCount: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  if (repeatCount < 1) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  if (blockIndex < 0 || blockIndex >= workout.steps.length) {
    return {};
  }

  const block = workout.steps[blockIndex];
  if (!isRepetitionBlock(block)) {
    return {};
  }

  const updatedBlock: RepetitionBlock = {
    ...block,
    repeatCount,
  };

  const updatedSteps = [...workout.steps];
  updatedSteps[blockIndex] = updatedBlock;

  const updatedWorkout: Workout = {
    ...workout,
    steps: updatedSteps,
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
