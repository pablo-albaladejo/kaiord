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
import { persistNewProfile } from "./helpers/persist-new-profile";
import { createNewProfile } from "./helpers/profile-factory";

export type CreateProfileOptions = { bodyWeight?: number };

export const createProfile = async (
  persistence: PersistencePort,
  name: string,
  options: CreateProfileOptions = {}
): Promise<Profile> => {
  const profile = createNewProfile(name, options);

  await persistNewProfile(persistence, profile);
  return profile;
};
