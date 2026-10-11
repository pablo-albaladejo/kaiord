/**
 * Profile Updater
 *
 * Functions for updating profile data.
 */

import type { Profile } from "../../../types/profile";
import type { UpdateProfileInput } from "../update-profile";
import { claimProfile } from "./claim-profile";

export function updateProfileData(
  profile: Profile,
  updates: UpdateProfileInput
): Profile {
  return claimProfile({
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
