/**
 * Calculate Workout Duration
 *
 * Utility to calculate total workout duration from KRD.
 */

import type { KRD } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";

type TimeDuration = { type: "time"; seconds: number };

/** Return the step's seconds if it carries a finite time duration, else 0. */
function stepSeconds(step: unknown): number {
  if (typeof step !== "object" || step === null) return 0;
  if (!("duration" in step)) return 0;
  const duration = (step as { duration: unknown }).duration;
  if (typeof duration !== "object" || duration === null) return 0;
  const { type, seconds } = duration as Partial<TimeDuration>;
  return type === "time" && typeof seconds === "number" ? seconds : 0;
}

/** Sum seconds across a repetition block's inner steps × repeatCount. */
function blockSeconds(step: unknown): number {
  if (typeof step !== "object" || step === null) return 0;
  if (!("repeatCount" in step) || !("steps" in step)) return 0;
  const innerSteps = (step as { steps: unknown }).steps;
  if (!Array.isArray(innerSteps)) return 0;
  const repeats = (step as { repeatCount: unknown }).repeatCount;
  if (typeof repeats !== "number") return 0;
  return (
    innerSteps.reduce<number>((sum, s) => sum + stepSeconds(s), 0) * repeats
  );
}

export function calculateWorkoutDuration(workout: KRD): number | undefined {
  const structured = getStructuredWorkout(workout);
  if (!structured || structured.steps.length === 0) return undefined;
  const totalSeconds = structured.steps.reduce<number>(
    (sum, step) => sum + (blockSeconds(step) || stepSeconds(step)),
    0
  );
  return totalSeconds > 0 ? totalSeconds : undefined;
}
