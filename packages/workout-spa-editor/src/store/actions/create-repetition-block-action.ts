/**
 * Create Repetition Block Action
 *
 * Action for wrapping selected steps in a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Creates a repetition block from selected step indices
 *
 * @param krd - Current KRD workout
 * @param stepIndices - Array of step indices to wrap in a repetition block
 * @param repeatCount - Number of times to repeat (minimum 2)
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const createRepetitionBlockAction = (
  krd: KRD,
  stepIndices: Array<number>,
  repeatCount: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  // Validate inputs
  if (stepIndices.length === 0) {
    return {};
  }

  if (repeatCount < 2) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  // Sort indices to ensure correct order
  const sortedIndices = [...stepIndices].sort((a, b) => a - b);

  // Extract steps to be wrapped
  const stepsToWrap: Array<WorkoutStep> = [];
  const remainingSteps: Array<WorkoutStep | RepetitionBlock> = [];

  workout.steps.forEach((step) => {
    if (isWorkoutStep(step) && sortedIndices.includes(step.stepIndex)) {
      stepsToWrap.push(step);
    } else {
      remainingSteps.push(step);
    }
  });

  // Create the repetition block
  const repetitionBlock: RepetitionBlock = {
    repeatCount,
    steps: stepsToWrap,
  };

  // Insert the repetition block at the position of the first selected step
  const insertPosition = sortedIndices[0];
  const newSteps = [
    ...remainingSteps.slice(0, insertPosition),
    repetitionBlock,
    ...remainingSteps.slice(insertPosition),
  ];

  // Recalculate stepIndex for all remaining WorkoutSteps
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      const reindexedStep = {
        ...step,
        stepIndex: currentIndex,
      };
      currentIndex++;
      return reindexedStep;
    }
    return step;
  });

  const updatedWorkout = {
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
