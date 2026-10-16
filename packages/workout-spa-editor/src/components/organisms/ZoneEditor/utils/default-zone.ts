/**
 * Default zone builder
 *
 * Creates a default zone object for adding custom zones. The caller supplies
 * the already-translated display name.
 */

import type { ZoneType } from "../../../../application/profile/zones/zone-types";

export function buildDefaultZone(
  zoneType: ZoneType,
  zoneNumber: number,
  name: string
): unknown {
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
