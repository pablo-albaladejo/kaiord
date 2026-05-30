import type { Profile } from "../../types/profile";
import type { SportThresholds, SportZoneConfig } from "../../types/sport-zones";
import type { ActiveSport } from "./sports";

/** Builds a minimal valid Profile with one sport's thresholds set, for unit
    tests of the Athlete derivation helpers. */
export function profileWith(
  sport: ActiveSport,
  thresholds: SportThresholds,
  maxHeartRate?: number
): Profile {
  const config: SportZoneConfig = {
    thresholds,
    heartRateZones: { method: "karvonen-5", zones: [] },
  };
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Test Athlete",
    maxHeartRate,
    sportZones: { [sport]: config },
    linkedAccounts: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}
