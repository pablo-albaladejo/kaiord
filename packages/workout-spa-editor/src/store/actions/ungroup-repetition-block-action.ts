/**
 * Ungroup Repetition Block Action
 *
 * Action for extracting steps from a repetition block back into individual steps.
 *
 * Requirements:
 * - Requirement 7.4: Ungroup repetition blocks
 */

import type { KRD, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { recalculateStepIndices } from "./recalculate-step-indices";

/**
 * Ungroups a repetition block, extracting its steps back into the workout
 *
 * @param krd - Current KRD workout
 * @param blockIndex - Index of the repetition block to ungroup
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const ungroupRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  // Validate block index
  if (blockIndex < 0 || blockIndex >= workout.steps.length) {
    return {};
  }

  const block = workout.steps[blockIndex];

  // Validate that the target is a repetition block
  if (!isRepetitionBlock(block)) {
    return {};
  }

  // Extract steps from the block
  const extractedSteps = block.steps;

  // Remove the block and insert the extracted steps at its position
  const newSteps = [
    ...workout.steps.slice(0, blockIndex),
    ...extractedSteps,
    ...workout.steps.slice(blockIndex + 1),
  ];

  // Recalculate step indices for all steps
  const reindexedSteps = recalculateStepIndices(newSteps);

  const updatedWorkout: Workout = {
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
