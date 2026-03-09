/**
 * Zone Info Helpers
 *
 * Utilities for displaying zone information
 */

import {
  calculateHeartRateFromZone,
  calculatePowerFromZone,
  getHeartRateZoneName,
  getPowerZoneName,
} from "./helpers";
import type { Profile } from "../../../types/profile";

export const getZoneInfo = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  value: string,
  activeProfile?: Profile | null
): string | null => {
  if (unit !== "zone" || !value || !activeProfile) return null;

  const zoneNumber = Number.parseInt(value, 10);
  const cycling = activeProfile.sportZones.cycling;
  if (!cycling) return null;

  if (targetType === "power") {
    const zones = cycling.powerZones?.zones ?? [];
    const zoneName = getPowerZoneName(zoneNumber, zones);
    const zoneRange = calculatePowerFromZone(
      zoneNumber,
      zones,
      cycling.thresholds.ftp
    );

    if (zoneName && zoneRange) {
      return `${zoneName} (${zoneRange.min}-${zoneRange.max}W)`;
    }
    return zoneName;
  }

  if (targetType === "heart_rate") {
    const zones = cycling.heartRateZones.zones;
    const zoneName = getHeartRateZoneName(zoneNumber, zones);
    const zoneRange = calculateHeartRateFromZone(zoneNumber, zones);

    if (zoneName && zoneRange) {
      return `${zoneName} (${zoneRange.min}-${zoneRange.max} BPM)`;
    }
    return zoneName;
  }

  return null;
};
