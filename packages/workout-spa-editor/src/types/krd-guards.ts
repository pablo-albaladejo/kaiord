/**
 * KRD Type Guards
 *
 * Type guard functions for discriminating between KRD union types.
 */

import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";

/**
 * Type guard to check if a step is a RepetitionBlock
 */
export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => {
  return "repeatCount" in step && "steps" in step;
};

/**
 * Type guard to check if a step is a WorkoutStep
 */
export const isWorkoutStep = (
  step: WorkoutStep | RepetitionBlock
): step is WorkoutStep => {
  return "stepIndex" in step && !("repeatCount" in step);
};
