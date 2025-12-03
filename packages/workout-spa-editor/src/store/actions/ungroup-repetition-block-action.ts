/**
 * Ungroup Repetition Block Action
 *
 * Action for extracting steps from a repetition block back into individual steps.
 *
 * Requirements:
 * - Requirement 7.4: Ungroup repetition blocks
 * - Requirement 2.4: Use block ID for operations
 */

import type { KRD, Workout } from "../../types/krd";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { recalculateStepIndices } from "./recalculate-step-indices";

/**
 * Ungroups a repetition block by its ID, extracting its steps back into the workout
 *
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block to ungroup
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const ungroupRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  // Find block by ID
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { block, position } = blockInfo;

  // Extract steps from the block
  const extractedSteps = block.steps;

  // Remove the block and insert the extracted steps at its position
  const newSteps = [
    ...workout.steps.slice(0, position),
    ...extractedSteps,
    ...workout.steps.slice(position + 1),
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
