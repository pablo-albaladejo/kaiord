/**
 * LTHR-Based Heart Rate Zone Calculator
 *
 * Calculates 5 heart rate zones from Lactate Threshold Heart Rate.
 * Uses industry-standard LTHR percentage model.
 */

import type { HeartRateZone } from "../types/profile";

const HR_ZONE_DEFS = [
  { zone: 1, name: "Recovery", min: 0, max: 82 },
  { zone: 2, name: "Aerobic", min: 82, max: 89 },
  { zone: 3, name: "Tempo", min: 89, max: 94 },
  { zone: 4, name: "Threshold", min: 94, max: 100 },
  { zone: 5, name: "VO2 Max", min: 100, max: 106 },
] as const;

/**
 * Calculate heart rate zones from LTHR
 *
 * @param lthr - Lactate Threshold Heart Rate in BPM
 * @returns Array of 5 heart rate zones with BPM ranges
 */
export const calculateHrZones = (lthr: number): Array<HeartRateZone> =>
  HR_ZONE_DEFS.map(({ zone, name, min, max }) => ({
    zone,
    name,
    minBpm: Math.round((lthr * min) / 100),
    maxBpm: Math.round((lthr * max) / 100),
  }));
