/**
 * Validators for paste step action
 */

import type { RepetitionBlock, WorkoutStep } from "../../types/krd";

/**
 * Validate if the parsed data is a valid WorkoutStep
 */
export const isValidWorkoutStep = (data: unknown): data is WorkoutStep => {
  if (!data || typeof data !== "object") return false;
  const step = data as Partial<WorkoutStep>;
  return (
    typeof step.stepIndex === "number" &&
    typeof step.durationType === "string" &&
    typeof step.duration === "object" &&
    typeof step.targetType === "string" &&
    typeof step.target === "object"
  );
};

/**
 * Validate if the parsed data is a valid RepetitionBlock
 */
export const isValidRepetitionBlock = (
  data: unknown
): data is RepetitionBlock => {
  if (!data || typeof data !== "object") return false;
  const block = data as Partial<RepetitionBlock>;
  return (
    typeof block.repeatCount === "number" &&
    Array.isArray(block.steps) &&
    block.steps.every(isValidWorkoutStep)
  );
};
