/**
 * Create Repetition Block Action
 *
 * Action for wrapping selected steps in a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 */

import { generateBlockId } from "../../utils/id-generation";
import { createUpdateWorkoutAction } from "../workout-actions";
import {
  calculateInsertPosition,
  extractSteps,
  reindexSteps,
} from "./repetition-block-helpers";
import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";

/**
 * Creates a repetition block from selected step indices
 */
export const createRepetitionBlockAction = (
  krd: KRD,
  stepIndices: Array<number>,
  repeatCount: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (
    !krd.extensions?.structured_workout ||
    stepIndices.length === 0 ||
    repeatCount < 2
  ) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
  const selectedIndices = new Set(stepIndices);

  const { stepsToWrap, remainingSteps, insertPosition } = extractSteps(
    workout,
    selectedIndices
  );

  if (insertPosition === null || stepsToWrap.length === 0) {
    return {};
  }

  const repetitionBlock: RepetitionBlock = {
    id: generateBlockId(),
    repeatCount,
    steps: stepsToWrap,
  };
  const adjustedPosition = calculateInsertPosition(
    workout,
    insertPosition,
    selectedIndices
  );

  const newSteps = [
    ...remainingSteps.slice(0, adjustedPosition),
    repetitionBlock,
    ...remainingSteps.slice(adjustedPosition),
  ];

  const updatedWorkout = { ...workout, steps: reindexSteps(newSteps) };
  const updatedKrd: KRD = {
    ...krd,
    extensions: { ...krd.extensions, structured_workout: updatedWorkout },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
