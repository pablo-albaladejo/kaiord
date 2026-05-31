/**
 * Returns true when zones fan-out should run for `source` on the given
 * profile: the profile must have an active link for `source` AND an
 * enabled auto-import training-zones IntegrationPolicy. The nil-safety /
 * profile-not-found guard makes callers receive false on race conditions.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import { hasEnabledAutoImportZonesPolicy } from "./zones-auto-import";

export const shouldFanOutZones = async (
  p: PersistencePort,
  source: string,
  profileId: string
): Promise<boolean> => {
  const profile = await p.profiles.getById(profileId);
  const link = profile?.linkedAccounts.find((a) => a.source === source);
  if (!link) return false;
  return hasEnabledAutoImportZonesPolicy(p, profileId);
};
