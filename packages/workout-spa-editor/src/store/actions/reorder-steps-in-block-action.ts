/**
 * Reorder Steps in Repetition Block Action
 *
 * Action for reordering steps within a repetition block.
 * Requirement 3.4: Maintain repetition block integrity during reordering
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Reorders steps within a repetition block
 * @param krd - Current KRD workout
 * @param blockIndex - Index of the repetition block in the workout
 * @param activeIndex - Index of the step being moved within the block
 * @param overIndex - Index where the step should be moved to within the block
 * @param state - Current workout state
 * @returns Updated workout state with reordered steps in the block
 */
export const reorderStepsInBlockAction = (
  krd: KRD,
  blockIndex: number,
  activeIndex: number,
  overIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  // Handle edge cases
  if (activeIndex === overIndex) {
    return {}; // No change needed
  }

  const workout = krd.extensions.workout as Workout;
  const steps = [...workout.steps];

  // Validate block index
  if (blockIndex < 0 || blockIndex >= steps.length) {
    return {}; // Out of bounds
  }

  const block = steps[blockIndex];

  // Ensure it's a repetition block
  if (!isRepetitionBlock(block)) {
    return {}; // Not a repetition block
  }

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

  // Recalculate stepIndex for all steps in the block
  const reindexedSteps = blockSteps.map((step, index) => ({
    ...step,
    stepIndex: index,
  }));

  // Update the block with reordered steps
  const updatedBlock: RepetitionBlock = {
    ...block,
    steps: reindexedSteps,
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
