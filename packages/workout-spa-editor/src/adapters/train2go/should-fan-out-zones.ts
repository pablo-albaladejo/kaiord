/**
 * Returns true when the profile has an active link for `source`.
 * The syncZones flag has been removed (PR 5); zones fan-out is now
 * governed by IntegrationPolicy(direction='import',dataType='training-zones').
 * This helper retains the nil-safety / profile-not-found guard so
 * callers continue to receive false on race conditions.
 */
import type { PersistencePort } from "../../ports/persistence-port";

export const shouldFanOutZones = async (
  p: PersistencePort,
  source: string,
  profileId: string
): Promise<boolean> => {
  const profile = await p.profiles.getById(profileId);
  const link = profile?.linkedAccounts.find((a) => a.source === source);
  return link !== undefined;
};
