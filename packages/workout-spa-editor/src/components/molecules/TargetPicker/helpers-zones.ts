/**
 * Zone Helpers
 *
 * Functions for calculating zone information.
 */

import type { HeartRateZone, PowerZone } from "../../../types/profile";

export const getPowerZoneName = (
  zoneNumber: number,
  powerZones: Array<PowerZone>
): string | null => {
  const zone = powerZones.find((z) => z.zone === zoneNumber);
  return zone ? zone.name : null;
};

export const getHeartRateZoneName = (
  zoneNumber: number,
  heartRateZones: Array<HeartRateZone>
): string | null => {
  const zone = heartRateZones.find((z) => z.zone === zoneNumber);
  return zone ? zone.name : null;
};

export const calculatePowerFromZone = (
  zoneNumber: number,
  powerZones: Array<PowerZone>,
  ftp?: number
): { min: number; max: number } | null => {
  if (!ftp) return null;
  const zone = powerZones.find((z) => z.zone === zoneNumber);
  if (!zone) return null;

  return {
    min: Math.round((ftp * zone.minPercent) / 100),
    max: Math.round((ftp * zone.maxPercent) / 100),
  };
};

export const calculateHeartRateFromZone = (
  zoneNumber: number,
  heartRateZones: Array<HeartRateZone>
): { min: number; max: number } | null => {
  const zone = heartRateZones.find((z) => z.zone === zoneNumber);
  if (!zone) return null;

  return {
    min: zone.minBpm,
    max: zone.maxBpm,
  };
};
