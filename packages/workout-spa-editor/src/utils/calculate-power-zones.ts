/**
 * FTP-Based Power Zone Calculator
 *
 * Calculates 7 power zones from FTP using Coggan's model.
 */

import type { PowerZone } from "../types/profile";

const POWER_ZONE_DEFS = [
  { zone: 1, name: "Active Recovery", min: 0, max: 55 },
  { zone: 2, name: "Endurance", min: 56, max: 75 },
  { zone: 3, name: "Tempo", min: 76, max: 90 },
  { zone: 4, name: "Lactate Threshold", min: 91, max: 105 },
  { zone: 5, name: "VO2 Max", min: 106, max: 120 },
  { zone: 6, name: "Anaerobic Capacity", min: 121, max: 150 },
  { zone: 7, name: "Neuromuscular Power", min: 151, max: 200 },
] as const;

/**
 * Calculate power zones using Coggan's percentage model
 *
 * @returns Array of 7 power zones with FTP percentage ranges
 */
export const calculatePowerZones = (): Array<PowerZone> =>
  POWER_ZONE_DEFS.map(({ zone, name, min, max }) => ({
    zone,
    name,
    minPercent: min,
    maxPercent: max,
  }));
