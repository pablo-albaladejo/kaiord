/**
 * Profile Factory
 *
 * Functions for creating new profiles with sport-specific zones.
 */

import {
  calculateHeartRateZones,
  DEFAULT_HEART_RATE_ZONES,
} from "../../../types/profile";
import { calculateHrZones } from "../../../utils/calculate-hr-zones";
import { calculatePowerZones } from "../../../utils/calculate-power-zones";
import type { Profile } from "../../../types/profile";
import type { SportKey, SportZoneConfig } from "../../../types/sport-zones";

export function createNewProfile(
  name: string,
  options: {
    bodyWeight?: number;
    ftp?: number;
    maxHeartRate?: number;
  }
): Profile {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const heartRateZones = options.maxHeartRate
    ? calculateHeartRateZones(options.maxHeartRate)
    : DEFAULT_HEART_RATE_ZONES;

  const hrMethod = options.maxHeartRate ? "karvonen-5" : "custom";
  const hrZones = options.maxHeartRate
    ? calculateHrZones(options.maxHeartRate)
    : DEFAULT_HEART_RATE_ZONES;

  const sportZones = buildSportZones(
    options.ftp,
    options.maxHeartRate,
    hrMethod,
    hrZones
  );

  return {
    id,
    name,
    bodyWeight: options.bodyWeight,
    ftp: options.ftp,
    maxHeartRate: options.maxHeartRate,
    powerZones: calculatePowerZones(options.ftp, "coggan-7"),
    heartRateZones,
    sportZones,
    createdAt: now,
    updatedAt: now,
  } as Profile;
}

function buildSportZones(
  ftp: number | undefined,
  lthr: number | undefined,
  hrMethod: string,
  hrZones: typeof DEFAULT_HEART_RATE_ZONES
): Partial<Record<SportKey, SportZoneConfig>> {
  const baseHr = { method: hrMethod, zones: hrZones };
  const emptyHr = { method: "custom", zones: DEFAULT_HEART_RATE_ZONES };
  const hrConfig = lthr ? baseHr : emptyHr;

  return {
    cycling: {
      thresholds: { lthr, ftp },
      heartRateZones: hrConfig,
      powerZones: {
        method: "coggan-7",
        zones: calculatePowerZones(ftp, "coggan-7"),
      },
    },
    running: {
      thresholds: { lthr },
      heartRateZones: lthr ? { ...baseHr } : { ...emptyHr },
    },
    swimming: {
      thresholds: { lthr },
      heartRateZones: lthr ? { ...baseHr } : { ...emptyHr },
    },
    generic: {
      thresholds: { lthr },
      heartRateZones: lthr ? { ...baseHr } : { ...emptyHr },
    },
  };
}
