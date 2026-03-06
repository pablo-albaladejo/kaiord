/**
 * Threshold Pace-Based Pace Zone Calculator
 *
 * Calculates 5 pace zones from threshold pace.
 * Note: slower pace = higher number, so Z1 (easy) has the highest values.
 */

import type { PaceUnit, PaceZone } from "../types/profile";

const PACE_ZONE_DEFS = [
  { zone: 1, name: "Easy", min: 115, max: 200 },
  { zone: 2, name: "Aerobic", min: 108, max: 115 },
  { zone: 3, name: "Tempo", min: 100, max: 108 },
  { zone: 4, name: "Threshold", min: 93, max: 100 },
  { zone: 5, name: "VO2 Max", min: 0, max: 93 },
] as const;

/**
 * Calculate pace zones from threshold pace
 *
 * @param thresholdPace - Threshold pace in seconds (per km or per 100m)
 * @param unit - Pace unit (min_per_km or min_per_100m)
 * @returns Array of 5 pace zones with pace ranges in seconds
 */
export const calculatePaceZones = (
  thresholdPace: number,
  unit: PaceUnit
): Array<PaceZone> =>
  PACE_ZONE_DEFS.map(({ zone, name, min, max }) => ({
    zone,
    name,
    minPace: Math.round((thresholdPace * min) / 100),
    maxPace: Math.round((thresholdPace * max) / 100),
    unit,
  }));
