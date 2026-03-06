/**
 * Power Zone Calculator
 *
 * Calculates power zones from FTP using a specified method.
 */

import { POWER_METHODS, findMethod } from "../lib/zone-methods";
import type { PowerZone } from "../types/profile";

/**
 * Calculate power zones using specified method
 *
 * @param ftp - Functional Threshold Power in watts (optional)
 * @param methodId - Zone method ID (defaults to "coggan-7")
 * @returns Array of power zones with FTP percentage ranges
 */
export const calculatePowerZones = (
  _ftp?: number,
  methodId = "coggan-7"
): Array<PowerZone> => {
  const method = findMethod(POWER_METHODS, methodId) ?? POWER_METHODS[0];

  return method.defaults.map((def, i) => ({
    zone: i + 1,
    name: def.name,
    minPercent: def.minPercent,
    maxPercent: def.maxPercent,
  }));
};

/**
 * Calculate power zones with absolute watt values
 */
export const calculatePowerZoneValues = (
  ftp: number,
  methodId = "coggan-7"
): Array<{
  zone: number;
  name: string;
  minWatts: number;
  maxWatts: number;
}> => {
  const zones = calculatePowerZones(ftp, methodId);
  return zones.map((z) => ({
    zone: z.zone,
    name: z.name,
    minWatts: Math.round((ftp * z.minPercent) / 100),
    maxWatts: Math.round((ftp * z.maxPercent) / 100),
  }));
};
