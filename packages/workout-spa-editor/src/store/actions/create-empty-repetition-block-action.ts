/**
 * Create Empty Repetition Block Action
 *
 * Action for creating an empty repetition block (with no steps).
 *
 * Requirements:
 * - Allow users to create repetition blocks from scratch
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Creates an empty repetition block at the end of the workout
 *
 * @param krd - Current KRD workout
 * @param repeatCount - Number of times to repeat (minimum 1)
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const createEmptyRepetitionBlockAction = (
  krd: KRD,
  repeatCount: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  // Validate inputs
  if (repeatCount < 1) return {};

  const workout = krd.extensions.workout as Workout;

  // Create an empty repetition block
  const repetitionBlock: RepetitionBlock = {
    repeatCount,
    steps: [],
  };

  // Add the repetition block at the end
  const newSteps = [...workout.steps, repetitionBlock];

  // Recalculate stepIndex for all WorkoutSteps
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
