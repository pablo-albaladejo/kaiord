import type { RepetitionBlock, WorkoutStep } from "./schemas/workout";

/**
 * Type guard to check if a workout step is a RepetitionBlock.
 *
 * Checks for both `repeatCount` and `steps` properties to reliably
 * discriminate between WorkoutStep and RepetitionBlock union members.
 */
export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => "repeatCount" in step && "steps" in step;
