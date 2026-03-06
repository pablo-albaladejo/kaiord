/**
 * Sport Zone Updater
 *
 * Helpers for updating sport zone configs in profiles.
 */

import { SPORT_ZONE_CAPABILITIES } from "../../../types/sport-zones";
import { calculateHrZones } from "../../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../../utils/calculate-power-zones";
import type { Profile } from "../../../types/profile";
import type {
  SportKey,
  SportThresholds,
  SportZoneConfig,
} from "../../../types/sport-zones";

export function recalculateZones(
  config: SportZoneConfig,
  thresholds: SportThresholds,
  sport: SportKey
): SportZoneConfig {
  const caps = SPORT_ZONE_CAPABILITIES[sport];
  const updated = { ...config, thresholds };

  if (caps.hr && thresholds.lthr && updated.heartRateZones.mode === "auto") {
    updated.heartRateZones = {
      mode: "auto",
      zones: calculateHrZones(thresholds.lthr),
    };
  }

  if (caps.power && updated.powerZones?.mode === "auto") {
    updated.powerZones = { mode: "auto", zones: calculatePowerZones() };
  }

  if (
    caps.pace &&
    thresholds.thresholdPace &&
    thresholds.paceUnit &&
    updated.paceZones?.mode === "auto"
  ) {
    updated.paceZones = {
      mode: "auto",
      zones: calculatePaceZones(thresholds.thresholdPace, thresholds.paceUnit),
    };
  }

  return updated;
}

export function updateSportConfig(
  profile: Profile,
  sport: SportKey,
  updater: (config: SportZoneConfig) => SportZoneConfig
): Profile {
  const sportZones = { ...profile.sportZones } as NonNullable<
    Profile["sportZones"]
  >;
  const config = sportZones[sport];
  if (!config) return profile;

  sportZones[sport] = updater(config);
  return { ...profile, sportZones, updatedAt: new Date().toISOString() };
}
