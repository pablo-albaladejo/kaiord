/**
 * LTHR-Based Heart Rate Zone Calculator
 *
 * Calculates heart rate zones from LTHR using a specified method.
 */

import { findMethod, HR_METHODS } from "../lib/zone-methods";
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
  const method = findMethod(HR_METHODS, methodId);
  if (!method) return [];

  const zones: Array<HeartRateZone> = [];
  for (let i = 0; i < method.defaults.length; i++) {
    const def = method.defaults[i]!;
    const maxBpm = Math.round((lthr * def.maxPercent) / 100);
    const prev = zones[i - 1];
    const minBpm =
      i === 0 || prev === undefined
        ? Math.round((lthr * def.minPercent) / 100)
        : prev.maxBpm + 1;
    zones.push({ zone: i + 1, name: def.name, minBpm, maxBpm });
  }
  return zones;
};
