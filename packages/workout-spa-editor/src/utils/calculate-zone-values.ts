/**
 * Zone Value Calculator
 *
 * Calculates absolute zone values from a method and threshold.
 */

import type { ZoneMethod } from "../lib/zone-method-types";

export type ZoneValue = {
  zone: number;
  name: string;
  min: number;
  max: number;
};

/**
 * Calculate absolute zone values from method defaults and threshold
 *
 * @param method - The zone method with default percentages
 * @param threshold - The threshold value (FTP, LTHR, or pace)
 * @returns Array of zones with absolute min/max values
 */
export const calculateZoneValues = (
  method: ZoneMethod,
  threshold: number
): Array<ZoneValue> =>
  method.defaults.map((def, i) => ({
    zone: i + 1,
    name: def.name,
    min: Math.round((threshold * def.minPercent) / 100),
    max: Math.round((threshold * def.maxPercent) / 100),
  }));
