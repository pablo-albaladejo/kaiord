/**
 * Profile Updater
 *
 * Functions for updating profile data.
 */

import type { Profile } from "../../../types/profile";

export function updateProfileData(
  profile: Profile,
  updates: Partial<Pick<Profile, "name" | "bodyWeight">>
): Profile {
  return {
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}
