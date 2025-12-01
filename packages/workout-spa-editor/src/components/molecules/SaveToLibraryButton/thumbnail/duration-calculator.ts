/**
 * Duration Calculator
 *
 * Calculates durations for workout steps.
 */

import type { StepWithDuration } from "./types";

const DEFAULT_DURATION = 300; // 5 minutes

export function calculateStepDurations(steps: unknown[]): {
  durations: number[];
  total: number;
} {
  const durations: number[] = [];
  let total = 0;

  for (const step of steps) {
    const duration = calculateSingleStepDuration(step);
    durations.push(duration);
    total += duration;
  }

  return { durations, total };
}

function calculateSingleStepDuration(step: unknown): number {
  if (typeof step !== "object" || step === null) {
    return DEFAULT_DURATION;
  }

  // Repetition block
  if ("repeatCount" in step && "steps" in step && Array.isArray(step.steps)) {
    const blockDuration = step.steps.reduce((sum: number, s: unknown) => {
      return sum + getStepSeconds(s);
    }, 0);
    return blockDuration * (step.repeatCount as number);
  }

  // Regular step
  return getStepSeconds(step);
}

function getStepSeconds(step: unknown): number {
  if (
    typeof step === "object" &&
    step !== null &&
    "duration" in step &&
    typeof step.duration === "object" &&
    step.duration !== null &&
    "type" in step.duration &&
    step.duration.type === "time" &&
    "seconds" in step.duration &&
    typeof (step as StepWithDuration).duration.seconds === "number"
  ) {
    return (step as StepWithDuration).duration.seconds!;
  }
  return DEFAULT_DURATION;
}
