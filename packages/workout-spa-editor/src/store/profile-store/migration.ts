/**
 * Profile Migration
 *
 * Migrates legacy profiles to sport-specific zones with method field.
 */

import { buildEmptySportConfig } from "./migration-helpers";
import { migrateModeToMethod } from "./migration-mode-to-method";
import { DEFAULT_HEART_RATE_ZONES } from "../../types/profile-defaults";
import { calculateHrZones } from "../../utils/calculate-hr-zones";
import type { HeartRateZone, PowerZone } from "../../types/profile";
import type { SportKey, SportZoneConfig } from "../../types/sport-zones";

type LegacyProfile = Record<string, unknown> & {
  ftp?: number;
  maxHeartRate?: number;
  powerZones?: Array<PowerZone>;
  heartRateZones?: Array<HeartRateZone>;
};

/**
 * Detect and migrate legacy profiles to sport-specific zones
 */
export const migrateProfile = <T extends Record<string, unknown>>(
  profile: T
): T => {
  const migrated = migrateToSportZones(profile);
  return migrateModeToMethod(migrated);
};

function migrateToSportZones<T extends Record<string, unknown>>(profile: T): T {
  if (profile["sportZones"] !== undefined) return profile;

  const legacy = profile as LegacyProfile;
  const hasLthr = legacy.maxHeartRate !== undefined;
  const hrZones = hasLthr
    ? calculateHrZones(legacy.maxHeartRate!)
    : (legacy.heartRateZones ?? DEFAULT_HEART_RATE_ZONES);
  const hrMethod = hasLthr ? "karvonen-5" : "custom";

  const cycling: SportZoneConfig = {
    thresholds: { lthr: legacy.maxHeartRate, ftp: legacy.ftp },
    heartRateZones: { method: hrMethod, zones: hrZones },
    powerZones: { method: "custom", zones: legacy.powerZones ?? [] },
  };

  const generic: SportZoneConfig = {
    thresholds: { lthr: legacy.maxHeartRate },
    heartRateZones: { method: hrMethod, zones: hrZones },
  };

  const sportZones: Partial<Record<SportKey, SportZoneConfig>> = {
    cycling,
    generic,
    running: buildEmptySportConfig(legacy.maxHeartRate),
    swimming: buildEmptySportConfig(legacy.maxHeartRate),
  };

  return { ...profile, sportZones };
}
