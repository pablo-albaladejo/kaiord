/**
 * Profile Updater
 *
 * Functions for updating profile data.
 */

import type { Profile } from "../../../types/profile";
import type { UpdateProfileInput } from "../update-profile";

export function updateProfileData(
  profile: Profile,
  updates: UpdateProfileInput
): Profile {
  return {
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}
