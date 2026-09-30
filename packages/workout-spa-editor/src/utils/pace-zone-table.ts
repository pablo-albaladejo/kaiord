/**
 * Pace zones as the m/s ranges a Garmin payload carries. Garmin Connect has
 * no pace zone numbers, and every range needs BOTH ends, so an open end —
 * the Athlete page's "> 5:57/km" Z1 and "< 4:54/km" Z5, or a stored bound
 * of 0 — is written `OPEN_END_FACTOR` beyond the bound that is known.
 */
import type { PaceZoneTable } from "@kaiord/garmin";

import { PACE_MODEL } from "../lib/athlete/zone-models";
import type { PaceZone } from "../types/sport-zones";

/**
 * The synthetic end of an open range: 1.25× faster than its fastest known
 * bound, or 1.25× slower than its slowest one. A zone's intent is "at
 * least this fast" (Z5) or "no faster than this" (Z1); 25% leaves room for
 * any effort in that intent while still being a pace a watch can target.
 */
export const OPEN_END_FACTOR = 1.25;

type PaceRange = PaceZoneTable[number];

const range = (
  zone: number,
  aMps: number | undefined,
  bMps: number | undefined
): PaceRange | undefined => {
  if (aMps && bMps)
    return {
      zone,
      minMps: Math.min(aMps, bMps),
      maxMps: Math.max(aMps, bMps),
    };
  if (bMps) return { zone, minMps: bMps / OPEN_END_FACTOR, maxMps: bMps };
  if (aMps) return { zone, minMps: aMps, maxMps: aMps * OPEN_END_FACTOR };
  return undefined;
};

/**
 * Stored zones, in seconds per `metres`, as m/s. Fewer seconds is faster,
 * so `minPace` is the fast end. Both bounds 0 is a zone never set (left
 * out); ONE bound 0 is an open end (`calculatePaceZones` stores Z5's fast
 * end as 0).
 */
export const storedZoneTable = (
  zones: readonly PaceZone[],
  metres: number
): PaceZoneTable =>
  zones.flatMap((z) => {
    const slow = z.maxPace > 0 ? metres / z.maxPace : undefined;
    const fast = z.minPace > 0 ? metres / z.minPace : undefined;
    const r = range(z.zone, slow, fast);
    return r ? [r] : [];
  });

/**
 * Z1–Z5 derived from a threshold pace (seconds per `metres`) with the
 * Athlete page's model (`PACE_MODEL`, the zone map `deriveZoneMap` shows):
 * its bounds are fractions of the threshold speed.
 */
export const thresholdZoneTable = (
  thresholdPace: number,
  metres: number
): PaceZoneTable => {
  const speed = metres / thresholdPace;
  const edges = [
    undefined,
    ...PACE_MODEL.bounds.map((fraction) => fraction * speed),
    undefined,
  ];
  return PACE_MODEL.names.flatMap((_, i) => {
    const r = range(i + 1, edges[i], edges[i + 1]);
    return r ? [r] : [];
  });
};
