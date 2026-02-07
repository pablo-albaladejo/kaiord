/**
 * Reorder Steps in Repetition Block Action
 *
 * Action for reordering steps within a repetition block.
 * Requirement 3.4: Maintain repetition block integrity during reordering
 */

import { findBlockById } from "../utils/block-utils";
import { createUpdateWorkoutAction } from "../workout-actions";
import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";

/**
 * Reorders steps within a repetition block
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block
 * @param activeIndex - Index of the step being moved within the block
 * @param overIndex - Index where the step should be moved to within the block
 * @param state - Current workout state
 * @returns Updated workout state with reordered steps in the block
 */
export const reorderStepsInBlockAction = (
  krd: KRD,
  blockId: string,
  activeIndex: number,
  overIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  if (activeIndex === overIndex) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { block, position: blockIndex } = blockInfo;
  const steps = [...workout.steps];

  const blockSteps = [...block.steps];

  // Validate step indices
  if (
    activeIndex < 0 ||
    activeIndex >= blockSteps.length ||
    overIndex < 0 ||
    overIndex >= blockSteps.length
  ) {
    return {}; // Out of bounds
  }

  // Move the step within the block
  const [movedStep] = blockSteps.splice(activeIndex, 1);
  blockSteps.splice(overIndex, 0, movedStep);

  // NOTE: We do NOT update stepIndex during reorder to maintain stable React keys
  // The stepIndex will be updated on the next save/export operation
  // This preserves the original stepIndex values which are used for React keys

  // Update the block with reordered steps (without reindexing)
  const updatedBlock: RepetitionBlock = {
    ...block,
    steps: blockSteps,
  };

  // Update the workout with the modified block
  steps[blockIndex] = updatedBlock;

  const updatedWorkout = {
    ...workout,
    steps,
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
