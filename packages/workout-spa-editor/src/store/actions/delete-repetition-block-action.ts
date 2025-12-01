/**
 * Delete Repetition Block Action
 *
 * Action for deleting an entire repetition block and all its contained steps.
 *
 * Requirements:
 * - Remove the entire block and all its steps from the workout
 * - Recalculate stepIndex for all remaining steps
 * - Add deletion to undo history
 * - Clear selections that reference deleted block steps
 * - Update workout statistics after deletion
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Finds a repetition block by its index
 */
const findBlockByIndex = (
  workout: Workout,
  blockIndex: number
): { block: RepetitionBlock; position: number } | null => {
  let currentBlockIndex = 0;

  for (let i = 0; i < workout.steps.length; i++) {
    const step = workout.steps[i];
    if (isRepetitionBlock(step)) {
      if (currentBlockIndex === blockIndex) {
        return { block: step, position: i };
      }
      currentBlockIndex++;
    }
  }

  return null;
};

/**
 * Deletes a repetition block and all its contained steps
 */
export const deleteRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const blockInfo = findBlockByIndex(workout, blockIndex);

  if (!blockInfo) {
    return {};
  }

  const { block, position } = blockInfo;

  // Remove block and reindex steps
  const newSteps = workout.steps.filter((_, index) => index !== position);
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: { ...workout, steps: reindexedSteps },
    },
  };

  // Track deleted block for undo
  const deletedBlocks = state.deletedSteps || [];
  const newDeletedBlocks = [
    ...deletedBlocks,
    { step: block, index: position, timestamp: Date.now() },
  ];

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    selectedStepId: null,
    selectedStepIds: [],
    deletedSteps: newDeletedBlocks,
  };
};
