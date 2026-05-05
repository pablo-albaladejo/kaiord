/**
 * Edit Repetition Block Action
 *
 * Action for updating the repeat count of a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 * - Requirement 2.4: Use block ID for operations
 */

import type { KRD, RepetitionBlock } from "../../types/krd";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import {
  buildKrdWithWorkout,
  extractStructuredWorkout,
  replaceBlockAtPosition,
} from "./_helpers";

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
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};
  if (repeatCount < 1) return {};

  const blockInfo = findBlockById(workout, blockId);
  if (!blockInfo) return {};

  const { position } = blockInfo;

  const updatedBlock: RepetitionBlock = {
    ...blockInfo.block,
    repeatCount,
  };

  const updatedWorkout = replaceBlockAtPosition(
    workout,
    position,
    updatedBlock
  );
  const updatedKrd: KRD = buildKrdWithWorkout(krd, updatedWorkout);

  return createUpdateWorkoutAction(updatedKrd, state);
};
