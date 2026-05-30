import type { Workout } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import { flattenTimeSteps } from "./flatten-steps";
import { stepIntensityFactor } from "./intensity-factor";

const SECONDS_PER_HOUR = 3600;
const TSS_SCALE = 100;

/**
 * Standard TSS approximation: Σ (seconds × IF²) / 3600 × 100, summed over each
 * time-based step occurrence whose intensity factor is computable. Rounded.
 */
export function estimateTss(
  workout: Workout,
  thresholds: SportThresholds
): number {
  let tss = 0;
  for (const { step, seconds } of flattenTimeSteps(workout)) {
    if (seconds === null) continue;
    const factor = stepIntensityFactor(step.target, thresholds);
    if (factor === null) continue;
    tss += ((seconds * factor * factor) / SECONDS_PER_HOUR) * TSS_SCALE;
  }
  return Math.round(tss);
}
