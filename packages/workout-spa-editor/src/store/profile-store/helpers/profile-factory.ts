/**
 * Profile Factory
 *
 * Functions for creating new profiles.
 */

import {
  calculateHeartRateZones,
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../../../types/profile";
import type { Profile } from "../../../types/profile";

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

  return {
    id,
    name,
    bodyWeight: options.bodyWeight,
    ftp: options.ftp,
    maxHeartRate: options.maxHeartRate,
    powerZones: DEFAULT_POWER_ZONES,
    heartRateZones,
    createdAt: now,
    updatedAt: now,
  };
}
