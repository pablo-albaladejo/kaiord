/**
 * Utility to recalculate step indices in a workout
 */

import type { RepetitionBlock, WorkoutStep } from "../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";

/**
 * Recalculate step indices for all steps in the workout
 */
export const recalculateStepIndices = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  let currentIndex = 0;

  return steps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    if (isRepetitionBlock(step)) {
      const updatedSteps = step.steps.map((s) => ({
        ...s,
        stepIndex: currentIndex++,
      }));
      return { ...step, steps: updatedSteps };
    }
    return step;
  });
};
