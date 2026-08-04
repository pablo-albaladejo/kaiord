import type { ZoneNumber } from "../zone-colors";

/**
 * Two different questions asked of the same time-in-zone distribution.
 *
 * `dominantZone` answers "what is this session mostly?" and drives the lateral
 * card border. A tie resolves DOWNWARD: a 50/50 split between Z2 and Z4 is an
 * endurance session with a hard block in it, not a threshold session, and
 * claiming the higher zone would overstate every mixed workout in a list.
 *
 * `hardestZone` answers "how hard does this get?" and drives the named summary
 * metric.
 *
 * Both return null for an all-zero distribution — a session with no
 * classifiable structure has no zone, and callers render nothing rather than
 * a placeholder that claims otherwise.
 */

const toZone = (index: number): ZoneNumber => (index + 1) as ZoneNumber;

/** The zone holding the largest fraction of classified time; ties go lower. */
export function dominantZone(dist: readonly number[]): ZoneNumber | null {
  let bestIndex = -1;
  let best = 0;
  dist.forEach((value, index) => {
    if (value > best) {
      best = value;
      bestIndex = index;
    }
  });
  return bestIndex === -1 ? null : toZone(bestIndex);
}

/** The highest zone with any classified time at all. */
export function hardestZone(dist: readonly number[]): ZoneNumber | null {
  for (let index = dist.length - 1; index >= 0; index--) {
    if ((dist[index] ?? 0) > 0) return toZone(index);
  }
  return null;
}
