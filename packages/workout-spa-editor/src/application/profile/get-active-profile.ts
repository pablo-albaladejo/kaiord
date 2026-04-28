/**
 * getActiveProfile — pure use case
 *
 * Resolves the active profile via ProfileRepository. Port-only, framework-
 * free. Reads `meta.activeProfileId`, then fetches the profile by id.
 *
 * Note: use cases that link/sync/cascade-delete MUST take `profileId` as
 * an explicit argument (captured at user-action time), NOT call this
 * function — see design D3 / D5 for the profile-switch race rationale.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";

export const getActiveProfile = async (
  profiles: ProfileRepository
): Promise<Profile | null> => {
  const id = await profiles.getActiveId();
  if (!id) return null;
  const profile = await profiles.getById(id);
  return profile ?? null;
};
