import type { WorkoutStep } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import { calculateStepDistance } from "../../utils/workout-stats-duration";
import { thresholdSpeed } from "./classify-zone";

/**
 * Estimated seconds for a distance-based step, from the sport's pace
 * threshold. Distance steps declare intensity too — "1.3 km Z2" — and
 * dropping them zeroes whole swim/run weeks out of the zone distribution.
 * Without a pace threshold there is no basis for an estimate: the step
 * contributes nothing rather than a number with invented provenance.
 */
export function estimateDistanceSeconds(
  step: WorkoutStep,
  thresholds: SportThresholds
): number | null {
  const meters = calculateStepDistance(step.duration);
  if (meters === null) return null;
  const speed = thresholdSpeed(thresholds);
  if (speed === null) return null;
  return meters / speed;
}
