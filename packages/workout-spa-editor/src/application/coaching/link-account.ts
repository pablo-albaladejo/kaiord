/**
 * linkAccount — application use case
 *
 * Adds or replaces a coaching-platform link on a specific Kaiord profile.
 * `profileId` is captured by the caller at user-action time (e.g., the
 * connect-flow click handler in LinkedAccountsSection) and passed in
 * explicitly. The use case MUST NOT call `getActiveId()` internally —
 * that would race with profile switches mid-poll (see design D3).
 *
 * Throws ProfileNotFoundError if the profile no longer exists between
 * click and execution (deletion race). The caller surfaces a "Profile
 * no longer exists" toast and aborts cleanly.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import { linkCoachingAccount } from "../../types/coaching-account";
import { ProfileNotFoundError } from "../profile/errors";

export const linkAccount = async (
  profiles: ProfileRepository,
  profileId: string,
  account: LinkedCoachingAccount
): Promise<void> => {
  const profile = await profiles.getById(profileId);
  if (!profile) {
    throw new ProfileNotFoundError(profileId);
  }
  const updated = linkCoachingAccount(profile, account);
  await profiles.put({ ...updated, updatedAt: new Date().toISOString() });
};
