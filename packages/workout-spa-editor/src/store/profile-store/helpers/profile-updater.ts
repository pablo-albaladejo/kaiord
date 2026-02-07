/**
 * Profile Updater
 *
 * Functions for updating profile data.
 */

import { calculateHeartRateZones } from "../../../types/profile";
import type { HeartRateZone, PowerZone, Profile } from "../../../types/profile";

export function updateProfileData(
  profile: Profile,
  updates: Partial<Profile>
): Profile {
  const now = new Date().toISOString();

  const updatedProfile: Profile = {
    ...profile,
    ...updates,
    updatedAt: now,
  };

  if (
    updates.maxHeartRate !== undefined &&
    updates.maxHeartRate !== profile.maxHeartRate
  ) {
    updatedProfile.heartRateZones = calculateHeartRateZones(
      updates.maxHeartRate
    );
  }

  return updatedProfile;
}

export function updateProfileZones(
  profile: Profile,
  zones: PowerZone[] | HeartRateZone[],
  zoneType: "power" | "heartRate"
): Profile {
  const now = new Date().toISOString();

  if (zoneType === "power") {
    return {
      ...profile,
      powerZones: zones as PowerZone[],
      updatedAt: now,
    };
  } else {
    return {
      ...profile,
      heartRateZones: zones as HeartRateZone[],
      updatedAt: now,
    };
  }
}
