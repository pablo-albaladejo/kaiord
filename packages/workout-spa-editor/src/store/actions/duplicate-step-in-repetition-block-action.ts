/**
 * Duplicate Step in Repetition Block Action
 *
 * Action for duplicating a step within a repetition block.
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { findBlockById } from "./delete-repetition-block-action";

/**
 * Duplicates a step within a repetition block
 *
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block
 * @param stepIndex - Index of the step within the repetition block
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const duplicateStepInRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { block, position: blockIndex } = blockInfo;

  if (stepIndex < 0 || stepIndex >= block.steps.length) {
    return {};
  }

  // Create a deep clone of the step
  const stepToDuplicate = block.steps[stepIndex];
  const duplicatedStep = structuredClone(stepToDuplicate);

  // Insert the duplicated step after the original (at stepIndex + 1)
  const updatedBlockSteps = [
    ...block.steps.slice(0, stepIndex + 1),
    duplicatedStep,
    ...block.steps.slice(stepIndex + 1),
  ];

  // Recalculate stepIndex for all steps in the block
  const reindexedSteps = updatedBlockSteps.map((step, index) => ({
    ...step,
    stepIndex: index,
  }));

  const updatedBlock: RepetitionBlock = {
    ...block,
    steps: reindexedSteps,
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
