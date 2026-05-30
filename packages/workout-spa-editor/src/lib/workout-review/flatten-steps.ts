import type { Workout, WorkoutStep } from "@kaiord/core";

import { isRepetitionBlock } from "../../types/krd-guards";
import { calculateStepDuration } from "../../utils/workout-stats-duration";

export type FlatStep = { step: WorkoutStep; seconds: number | null };

/**
 * Flatten a workout into individual time-step occurrences. A top-level step
 * contributes once; a repetition block contributes each inner step `repeatCount`
 * times. `seconds` is null for non-time-based durations.
 */
export function flattenTimeSteps(workout: Workout): FlatStep[] {
  const out: FlatStep[] = [];
  for (const item of workout.steps) {
    if (isRepetitionBlock(item)) {
      for (let rep = 0; rep < item.repeatCount; rep += 1) {
        for (const inner of item.steps) {
          out.push({
            step: inner,
            seconds: calculateStepDuration(inner.duration),
          });
        }
      }
    } else {
      out.push({ step: item, seconds: calculateStepDuration(item.duration) });
    }
  }
  return out;
}
