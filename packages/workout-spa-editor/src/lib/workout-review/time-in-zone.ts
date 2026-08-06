import type { Workout } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import { classifyTargetZone } from "./classify-zone";
import { estimateDistanceSeconds } from "./estimate-distance-seconds";
import { flattenTimeSteps } from "./flatten-steps";

const ZONE_COUNT = 5;

/**
 * Fraction of classified time spent in each of the five zones (length 5).
 * Time-based steps contribute their seconds; distance-based steps contribute
 * seconds estimated from the sport's pace threshold. Steps whose target does
 * not classify — or distance steps without a pace threshold — are skipped.
 * Returns all zeros when nothing is classifiable.
 */
export function timeInZone(
  workout: Workout,
  thresholds: SportThresholds
): number[] {
  const seconds = new Array<number>(ZONE_COUNT).fill(0);
  let total = 0;

  for (const { step, seconds: timed } of flattenTimeSteps(workout)) {
    const zone = classifyTargetZone(step.target, thresholds);
    if (zone === null) continue;
    const dur = timed ?? estimateDistanceSeconds(step, thresholds);
    if (dur === null) continue;
    const idx = zone - 1;
    seconds[idx] = (seconds[idx] ?? 0) + dur;
    total += dur;
  }

  if (total === 0) return seconds;
  return seconds.map((value) => value / total);
}
