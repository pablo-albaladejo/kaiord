/**
 * Edit Repetition Block Action
 *
 * Action for updating the repeat count of a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 * - Requirement 2.4: Use block ID for operations
 */

import { findBlockById } from "../utils/block-utils";
import { createUpdateWorkoutAction } from "../workout-actions";
import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";

/**
 * Updates the repeat count of a repetition block by its ID
 *
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block
 * @param repeatCount - New repeat count (minimum 1)
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const editRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
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

  // Find block by ID
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { position } = blockInfo;

  const updatedBlock: RepetitionBlock = {
    ...blockInfo.block,
    repeatCount,
  };

  const updatedSteps = [...workout.steps];
  updatedSteps[position] = updatedBlock;

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
