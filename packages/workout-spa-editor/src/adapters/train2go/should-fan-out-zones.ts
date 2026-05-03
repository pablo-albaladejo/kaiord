/**
 * Reads the just-persisted (or refreshed) profile and returns whether
 * the linked account for `source` has the `Sync zones` toggle on.
 * Defensively returns `false` when the profile/link no longer exists,
 * so a connect/sync race can never trigger a phantom zones-sync.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const shouldFanOutZones = async (
  p: PersistencePort,
  source: string,
  profileId: string
): Promise<boolean> => {
  const profile = await p.profiles.getById(profileId);
  const link = profile?.linkedAccounts.find((a) => a.source === source);
  return link?.syncZones === true;
};
