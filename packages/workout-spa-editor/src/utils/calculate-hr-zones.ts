/**
 * LTHR-Based Heart Rate Zone Calculator
 *
 * Calculates heart rate zones from LTHR using a specified method.
 */

import { HR_METHODS, findMethod } from "../lib/zone-methods";
import type { HeartRateZone } from "../types/profile";

/**
 * Calculate heart rate zones from LTHR
 *
 * @param lthr - Lactate Threshold Heart Rate in BPM
 * @param methodId - Zone method ID (defaults to "karvonen-5")
 * @returns Array of heart rate zones with BPM ranges
 */
export const calculateHrZones = (
  lthr: number,
  methodId = "karvonen-5"
): Array<HeartRateZone> => {
  const method = findMethod(HR_METHODS, methodId) ?? HR_METHODS[0];

  return method.defaults.map((def, i) => ({
    zone: i + 1,
    name: def.name,
    minBpm: Math.round((lthr * def.minPercent) / 100),
    maxBpm: Math.round((lthr * def.maxPercent) / 100),
  }));
};
