/**
 * Threshold Pace-Based Pace Zone Calculator
 *
 * Calculates pace zones from threshold pace using a specified method.
 * Note: slower pace = higher number, so Z1 (easy) has the highest values.
 */

import { PACE_METHODS, findMethod } from "../lib/zone-methods";
import type { PaceUnit, PaceZone } from "../types/profile";

/**
 * Calculate pace zones from threshold pace
 *
 * @param thresholdPace - Threshold pace in seconds
 * @param unit - Pace unit (min_per_km or min_per_100m)
 * @param methodId - Zone method ID (defaults to "daniels-5")
 * @returns Array of pace zones with pace ranges in seconds
 */
export const calculatePaceZones = (
  thresholdPace: number,
  unit: PaceUnit,
  methodId = "daniels-5"
): Array<PaceZone> => {
  const method = findMethod(PACE_METHODS, methodId);
  if (!method) return [];

  return method.defaults.map((def, i) => ({
    zone: i + 1,
    name: def.name,
    minPace: Math.round((thresholdPace * def.minPercent) / 100),
    maxPace: Math.round((thresholdPace * def.maxPercent) / 100),
    unit,
  }));
};
