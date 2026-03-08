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
): Array<ZoneValue> => {
  const zones: Array<ZoneValue> = [];
  for (let i = 0; i < method.defaults.length; i++) {
    const def = method.defaults[i];
    const max = Math.round((threshold * def.maxPercent) / 100);
    const min =
      i === 0
        ? Math.round((threshold * def.minPercent) / 100)
        : zones[i - 1].max + 1;
    zones.push({ zone: i + 1, name: def.name, min, max });
  }
  return zones;
};
