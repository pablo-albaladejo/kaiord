/**
 * unlinkAccount — application use case
 *
 * Removes a coaching-platform link from a specific Kaiord profile.
 * Idempotent by design: silent no-op when the profile no longer exists OR
 * when the source is not linked. Disconnect intent is satisfied by absence;
 * surfacing an error toast on already-absent state would be noise.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import { unlinkCoachingAccount } from "../../types/coaching-account";

export const unlinkAccount = async (
  profiles: ProfileRepository,
  profileId: string,
  source: string
): Promise<void> => {
  const profile = await profiles.getById(profileId);
  if (!profile) return;
  if (!profile.linkedAccounts.some((a) => a.source === source)) return;
  const updated = unlinkCoachingAccount(profile, source);
  await profiles.put({ ...updated, updatedAt: new Date().toISOString() });
};
