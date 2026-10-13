/**
 * importProfile — application use case.
 *
 * Persists a validated, previously exported profile as a NEW profile: every
 * athlete field (thresholds, zones, personal data) is kept, but identity is
 * fresh. It gets a new id and new timestamps, `linkedAccounts` is reset
 * (an external link must not be duplicated onto a second profile) and
 * `origin` is dropped so the result is a real profile, never an auto one.
 *
 * Throws on persistence rejection; the caller surfaces the error.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";
import { persistNewProfile } from "./helpers/persist-new-profile";

export const importProfile = async (
  persistence: PersistencePort,
  source: Profile
): Promise<Profile> => {
  const now = new Date().toISOString();
  const profile: Profile = {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    linkedAccounts: [],
    createdAt: now,
    updatedAt: now,
  };

  delete profile.origin;
  await persistNewProfile(persistence, profile);
  return profile;
};
