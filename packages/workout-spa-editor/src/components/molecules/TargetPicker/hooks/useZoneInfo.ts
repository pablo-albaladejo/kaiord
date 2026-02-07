/**
 * useZoneInfo Hook
 *
 * Calculates zone information for power and heart rate targets.
 */

import {
  calculateHeartRateFromZone,
  calculatePowerFromZone,
  getHeartRateZoneName,
  getPowerZoneName,
} from "../helpers";
import type { Profile } from "../../../../types/profile";

export const useZoneInfo = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  value: string,
  activeProfile?: Profile | null
): string | null => {
  const zoneNumber = value ? Number.parseInt(value, 10) : null;

  if (unit !== "zone" || !zoneNumber || !activeProfile) {
    return null;
  }

  if (targetType === "power") {
    const zoneName = getPowerZoneName(zoneNumber, activeProfile.powerZones);
    const zoneRange = calculatePowerFromZone(
      zoneNumber,
      activeProfile.powerZones,
      activeProfile.ftp
    );

    if (zoneName && zoneRange) {
      return `${zoneName} (${zoneRange.min}-${zoneRange.max}W)`;
    }
    return zoneName;
  }

  if (targetType === "heart_rate") {
    const zoneName = getHeartRateZoneName(
      zoneNumber,
      activeProfile.heartRateZones
    );
    const zoneRange = calculateHeartRateFromZone(
      zoneNumber,
      activeProfile.heartRateZones
    );

    if (zoneName && zoneRange) {
      return `${zoneName} (${zoneRange.min}-${zoneRange.max} BPM)`;
    }
    return zoneName;
  }

  return null;
};
