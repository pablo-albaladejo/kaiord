import type { Workout } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import { classifyTargetZone } from "./classify-zone";
import { flattenTimeSteps } from "./flatten-steps";

const ZONE_COUNT = 5;

/**
 * Fraction of classified time spent in each of the five zones (length 5).
 * Non-time-based or unclassifiable steps are skipped. Returns all zeros when
 * nothing is classifiable.
 */
export function timeInZone(
  workout: Workout,
  thresholds: SportThresholds
): number[] {
  const seconds = new Array<number>(ZONE_COUNT).fill(0);
  let total = 0;

  for (const { step, seconds: dur } of flattenTimeSteps(workout)) {
    if (dur === null) continue;
    const zone = classifyTargetZone(step.target, thresholds);
    if (zone === null) continue;
    const idx = zone - 1;
    seconds[idx] = (seconds[idx] ?? 0) + dur;
    total += dur;
  }

  if (total === 0) return seconds;
  return seconds.map((value) => value / total);
}
