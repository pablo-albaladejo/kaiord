import type { Workout } from "@kaiord/core";

import type { SportThresholds } from "../../types/sport-zones";
import type { ZoneNumber } from "../zone-colors";
import { classifyTargetZone } from "./classify-zone";
import { flattenTimeSteps } from "./flatten-steps";

const ZONE_COUNT = 5;

/** One contiguous run of same-zone time, in render order. */
export type ZoneSegment = { zone: ZoneNumber; seconds: number };

/**
 * The session's shape over time: consecutive steps that classify into the same
 * zone are merged into one segment, so a 4×(4 min Z4 / 2 min Z1) block reads as
 * eight alternating segments rather than eight identical bars.
 *
 * A step contributes nothing when its duration is not time-based or its target
 * does not classify — the same two exclusions `timeInZone` makes, so the
 * segments and the distribution always describe the same slice of the session.
 */
export function zoneSegments(
  workout: Workout,
  thresholds: SportThresholds
): ZoneSegment[] {
  const segments: ZoneSegment[] = [];
  for (const { step, seconds } of flattenTimeSteps(workout)) {
    if (seconds === null) continue;
    const zone = classifyTargetZone(step.target, thresholds);
    if (zone === null) continue;
    const last = segments.at(-1);
    if (last && last.zone === zone) last.seconds += seconds;
    else segments.push({ zone, seconds });
  }
  return segments;
}

/**
 * The zone holding the largest share of classified time. Ties resolve to the
 * harder zone — a session split evenly between Z2 and Z4 is a Z4 session, not
 * a Z2 one. Returns null when nothing classified, which is the "no calculable
 * dominant zone" case the card border and `--core-live` both leave neutral.
 */
export function dominantZone(dist: readonly number[]): ZoneNumber | null {
  let best: ZoneNumber | null = null;
  let bestShare = 0;
  for (let i = 0; i < dist.length; i += 1) {
    const share = dist[i] ?? 0;
    if (share > 0 && share >= bestShare) {
      bestShare = share;
      best = (i + 1) as ZoneNumber;
    }
  }
  return best;
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
