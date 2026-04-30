/**
 * createProfile — application use case.
 *
 * Persists a new profile via `PersistencePort` inside a single
 * transaction that covers the count check, the profile row put, and
 * the conditional `meta.activeProfileId` write. The first profile is
 * consistently both stored AND selected; subsequent profiles preserve
 * the existing active id but the read-modify-write still runs inside
 * one transaction so concurrent callers cannot observe a stale
 * `count` and clobber each other's active id (TOCTOU).
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
