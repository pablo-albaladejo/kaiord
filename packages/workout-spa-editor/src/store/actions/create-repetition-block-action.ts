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
 * @param repeatCount - Number of times to repeat (minimum 1)
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
  if (stepIndices.length === 0) return {};

  if (repeatCount < 2) return {};

  const workout = krd.extensions.workout as Workout;

  // Use Set for O(1) lookup of selected indices
  const selectedIndices = new Set(stepIndices);

  // Extract steps to be wrapped and track insertion position
  const stepsToWrap: Array<WorkoutStep> = [];
  const remainingSteps: Array<WorkoutStep | RepetitionBlock> = [];
  let insertPosition: number | null = null;

  workout.steps.forEach((step, index) => {
    if (isWorkoutStep(step) && selectedIndices.has(step.stepIndex)) {
      // Track the array index of the first selected step
      if (insertPosition === null) {
        insertPosition = index;
      }
      stepsToWrap.push(step);
    } else {
      remainingSteps.push(step);
    }
  });

  // Handle edge case: no steps matched
  if (insertPosition === null || stepsToWrap.length === 0) {
    return {};
  }

  // Create the repetition block
  const repetitionBlock: RepetitionBlock = {
    repeatCount,
    steps: stepsToWrap,
  };

  // Calculate the correct insertion position in remainingSteps array
  // We need to count how many items before insertPosition are in remainingSteps
  let adjustedInsertPosition = 0;
  for (let i = 0; i < insertPosition; i++) {
    const step = workout.steps[i];
    if (
      !isWorkoutStep(step) ||
      !selectedIndices.has((step as WorkoutStep).stepIndex)
    ) {
      adjustedInsertPosition++;
    }
  }

  // Insert the repetition block at the correct position
  const newSteps = [
    ...remainingSteps.slice(0, adjustedInsertPosition),
    repetitionBlock,
    ...remainingSteps.slice(adjustedInsertPosition),
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
