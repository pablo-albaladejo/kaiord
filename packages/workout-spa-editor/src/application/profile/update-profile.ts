/**
 * updateProfile — application use case.
 *
 * Reads the target profile, applies a partial `name`/`bodyWeight`
 * update, writes back. Throws `ProfileNotFoundError` when the id is
 * unknown so the calling component can surface a "Profile no longer
 * exists" toast instead of silently no-op'ing.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";
import { ProfileNotFoundError } from "./errors";
import { updateProfileData } from "./helpers/profile-updater";

export type UpdateProfileInput = Partial<Pick<Profile, "name" | "bodyWeight">>;

export const updateProfile = async (
  persistence: PersistencePort,
  profileId: string,
  updates: UpdateProfileInput
): Promise<Profile> => {
  const existing = await persistence.profiles.getById(profileId);
  if (!existing) throw new ProfileNotFoundError(profileId);

  const updated = updateProfileData(existing, updates);
  await persistence.profiles.put(updated);
  return updated;
};
