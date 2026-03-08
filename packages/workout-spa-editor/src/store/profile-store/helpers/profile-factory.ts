/**
 * Profile Factory
 *
 * Functions for creating new profiles with sport-specific zones.
 */

import { DEFAULT_HEART_RATE_ZONES } from "../../../types/profile";
import { calculatePowerZones } from "../../../utils/calculate-power-zones";
import type { Profile } from "../../../types/profile";
import type { SportKey, SportZoneConfig } from "../../../types/sport-zones";

export function createNewProfile(
  name: string,
  options: { bodyWeight?: number } = {}
): Profile {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    name,
    bodyWeight: options.bodyWeight,
    sportZones: buildSportZones(),
    createdAt: now,
    updatedAt: now,
  };
}

function buildSportZones(): Record<string, SportZoneConfig> {
  const emptyHr = { method: "custom", zones: DEFAULT_HEART_RATE_ZONES };

  return {
    cycling: {
      thresholds: {},
      heartRateZones: { ...emptyHr },
      powerZones: {
        method: "coggan-7",
        zones: calculatePowerZones("coggan-7"),
      },
    },
    running: {
      thresholds: {},
      heartRateZones: { ...emptyHr },
      powerZones: { method: "custom", zones: [] },
      paceZones: { method: "custom", zones: [] },
    },
    swimming: {
      thresholds: {},
      heartRateZones: { ...emptyHr },
      paceZones: { method: "custom", zones: [] },
    },
    generic: {
      thresholds: {},
      heartRateZones: { ...emptyHr },
    },
  } satisfies Record<SportKey, SportZoneConfig>;
}
