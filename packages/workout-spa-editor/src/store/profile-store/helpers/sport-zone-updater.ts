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

  if (caps.hr && thresholds.lthr) {
    const method = updated.heartRateZones.method;
    if (method !== "custom") {
      updated.heartRateZones = {
        method,
        zones: calculateHrZones(thresholds.lthr, method),
      };
    }
  }

  if (caps.power && updated.powerZones) {
    const method = updated.powerZones.method;
    if (method !== "custom") {
      updated.powerZones = {
        method,
        zones: calculatePowerZones(thresholds.ftp, method),
      };
    }
  }

  if (caps.pace && thresholds.thresholdPace && thresholds.paceUnit) {
    const method = updated.paceZones?.method ?? "daniels-5";
    if (method !== "custom") {
      updated.paceZones = {
        method,
        zones: calculatePaceZones(
          thresholds.thresholdPace,
          thresholds.paceUnit,
          method
        ),
      };
    }
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
