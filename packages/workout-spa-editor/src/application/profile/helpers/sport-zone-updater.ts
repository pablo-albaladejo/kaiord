/**
 * Sport Zone Updater
 *
 * Helpers for updating sport zone configs in profiles.
 */

import type { Profile } from "../../../types/profile";
import type {
  SportKey,
  SportThresholds,
  SportZoneConfig,
} from "../../../types/sport-zones";
import { SPORT_ZONE_CAPABILITIES } from "../../../types/sport-zones";
import { calculateHrZones } from "../../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../../utils/calculate-power-zones";
import { claimProfile } from "./claim-profile";
import { methodToApply } from "./zone-method-to-apply";

export function recalculateZones(
  config: SportZoneConfig,
  thresholds: SportThresholds,
  sport: SportKey
): SportZoneConfig {
  const caps = SPORT_ZONE_CAPABILITIES[sport];
  const updated = { ...config, thresholds };

  const hrMethod = methodToApply("hr", updated.heartRateZones);
  if (caps.hr && thresholds.lthr && hrMethod) {
    updated.heartRateZones = {
      method: hrMethod,
      zones: calculateHrZones(thresholds.lthr, hrMethod),
    };
  }

  const powerMethod = methodToApply("power", updated.powerZones);
  if (caps.power && updated.powerZones && thresholds.ftp && powerMethod) {
    updated.powerZones = {
      method: powerMethod,
      zones: calculatePowerZones(powerMethod),
    };
  }

  const paceMethod = methodToApply("pace", updated.paceZones);
  const { thresholdPace, paceUnit } = thresholds;
  if (caps.pace && thresholdPace && paceUnit && paceMethod) {
    updated.paceZones = {
      method: paceMethod,
      zones: calculatePaceZones(thresholdPace, paceUnit, paceMethod),
    };
  }

  return updated;
}

export function updateSportConfig(
  profile: Profile,
  sport: SportKey,
  updater: (config: SportZoneConfig) => SportZoneConfig
): Profile {
  const sportZones = { ...profile.sportZones };
  const config = sportZones[sport];
  if (!config) return profile;

  sportZones[sport] = updater(config);
  return claimProfile({
    ...profile,
    sportZones,
    updatedAt: new Date().toISOString(),
  });
}
