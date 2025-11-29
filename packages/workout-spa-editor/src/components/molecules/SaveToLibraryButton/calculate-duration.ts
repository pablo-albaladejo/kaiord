/**
 * Calculate Workout Duration
 *
 * Utility to calculate total workout duration from KRD.
 */

import type { KRD } from "../../../types/krd";

type StepWithDuration = {
  duration: {
    type: string;
    seconds?: number;
  };
};

export function calculateWorkoutDuration(workout: KRD): number | undefined {
  const workoutData = workout.extensions?.workout;
  if (
    !workoutData ||
    typeof workoutData !== "object" ||
    !("steps" in workoutData) ||
    !Array.isArray(workoutData.steps)
  )
    return undefined;

  const steps = workoutData.steps;
  if (steps.length === 0) return undefined;

  let totalSeconds = 0;

  for (const step of steps) {
    if (
      typeof step === "object" &&
      step !== null &&
      "repeatCount" in step &&
      "steps" in step &&
      Array.isArray(step.steps)
    ) {
      const blockDuration = step.steps.reduce((sum: number, s: unknown) => {
        if (
          typeof s === "object" &&
          s !== null &&
          "duration" in s &&
          typeof s.duration === "object" &&
          s.duration !== null &&
          "type" in s.duration &&
          s.duration.type === "time" &&
          "seconds" in s.duration &&
          typeof (s as StepWithDuration).duration.seconds === "number"
        ) {
          return sum + (s as StepWithDuration).duration.seconds!;
        }
        return sum;
      }, 0);
      totalSeconds += blockDuration * (step.repeatCount as number);
    } else if (
      typeof step === "object" &&
      step !== null &&
      "duration" in step &&
      typeof step.duration === "object" &&
      step.duration !== null &&
      "type" in step.duration &&
      step.duration.type === "time" &&
      "seconds" in step.duration
    ) {
      const seconds = (step as StepWithDuration).duration.seconds;
      if (typeof seconds === "number") {
        totalSeconds += seconds;
      }
    }
  }

  return totalSeconds > 0 ? totalSeconds : undefined;
}
