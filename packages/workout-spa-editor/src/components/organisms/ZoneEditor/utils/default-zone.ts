/**
 * Default zone builder
 *
 * Creates a default zone object for adding custom zones.
 */

import type { ZoneType } from "../../../../store/profile-store/types";

export function buildDefaultZone(
  zoneType: ZoneType,
  zoneNumber: number
): unknown {
  const name = `Zone ${zoneNumber}`;

  if (zoneType === "heartRateZones") {
    return { zone: zoneNumber, name, minBpm: 0, maxBpm: 0 };
  }
  if (zoneType === "powerZones") {
    return { zone: zoneNumber, name, minPercent: 0, maxPercent: 0 };
  }
  return {
    zone: zoneNumber,
    name,
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km",
  };
}
