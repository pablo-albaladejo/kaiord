/**
 * The profile a workout's file export resolves pace zones against, read
 * when the athlete clicks: the profile that owns the persisted record when
 * there is one — the same profile a Garmin push of that record uses
 * (`exportRecordGcn`) — and the active profile for a workout not yet
 * persisted. Read at click time, so no loading window exports without it.
 */
import { db } from "../adapters/dexie/dexie-database";
import { createDexieProfileRepository } from "../adapters/dexie/dexie-profile-repository";
import type { ProfileRepository } from "../ports/persistence-port";
import type { Profile } from "../types/profile";

const profileRepo = createDexieProfileRepository(db);

export const resolveExportProfile = async (
  ownerProfileId?: string,
  profiles: ProfileRepository = profileRepo
): Promise<Profile | null> => {
  const id = ownerProfileId ?? (await profiles.getActiveId());
  return id ? ((await profiles.getById(id)) ?? null) : null;
};
