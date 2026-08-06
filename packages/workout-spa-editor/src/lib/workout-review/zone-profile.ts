import type { Workout } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import type { ZoneNumber } from "../zone-colors";
import { classifyTargetZone } from "./classify-zone";
import { estimateDistanceSeconds } from "./estimate-distance-seconds";
import { flattenTimeSteps } from "./flatten-steps";

const ZONE_COUNT = 5;

/** One contiguous run of same-zone time, in render order. */
export type ZoneSegment = { zone: ZoneNumber; seconds: number };

/**
 * The session's shape over time: consecutive steps that classify into the same
 * zone are merged into one segment, so a 4×(4 min Z4 / 2 min Z1) block reads as
 * eight alternating segments rather than eight identical bars.
 *
 * A step contributes nothing when its target does not classify, or when its
 * duration is neither time-based nor an estimable distance — the same
 * exclusions `timeInZone` makes, so the segments and the distribution always
 * describe the same slice of the session.
 */
export function zoneSegments(
  workout: Workout,
  thresholds: SportThresholds
): ZoneSegment[] {
  const segments: ZoneSegment[] = [];
  for (const { step, seconds: timed } of flattenTimeSteps(workout)) {
    const zone = classifyTargetZone(step.target, thresholds);
    if (zone === null) continue;
    const seconds = timed ?? estimateDistanceSeconds(step, thresholds);
    if (seconds === null) continue;
    const last = segments.at(-1);
    if (last && last.zone === zone) last.seconds += seconds;
    else segments.push({ zone, seconds });
  }
  return segments;
}

/** Total classified seconds per zone (length 5), unnormalised. */
export function zoneSeconds(segments: readonly ZoneSegment[]): number[] {
  const totals = new Array<number>(ZONE_COUNT).fill(0);
  for (const segment of segments) {
    totals[segment.zone - 1] =
      (totals[segment.zone - 1] ?? 0) + segment.seconds;
  }
  return totals;
}
