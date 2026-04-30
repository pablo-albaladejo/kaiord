/**
 * createProfile — application use case.
 *
 * Persists a new profile via `PersistencePort`. When no profiles
 * exist yet, the profile row write AND the `meta.activeProfileId`
 * write are wrapped in `persistence.transaction` so the first
 * profile is consistently both stored AND selected; partial-failure
 * cannot leave an active id pointing at a non-existent row. For
 * subsequent profiles the existing active id is preserved with a
 * single-write put — no transaction needed.
 *
 * Throws on persistence rejection; the calling component SHALL
 * surface a user-visible error.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";
import { createNewProfile } from "./helpers/profile-factory";

export type CreateProfileOptions = { bodyWeight?: number };

export const createProfile = async (
  persistence: PersistencePort,
  name: string,
  options: CreateProfileOptions = {}
): Promise<Profile> => {
  const profile = createNewProfile(name, options);

  // Single transaction wraps the count check, the put, and the
  // conditional setActiveId so a concurrent `createProfile` cannot
  // observe `count === 0` from a stale read and overwrite the other
  // call's active id (TOCTOU). The lightweight `count()` primitive
  // avoids pulling the full collection just to test emptiness.
  await persistence.transaction(async () => {
    const isFirstProfile = (await persistence.profiles.count()) === 0;
    await persistence.profiles.put(profile);
    if (isFirstProfile) {
      await persistence.profiles.setActiveId(profile.id);
    }
  });
  return profile;
};
