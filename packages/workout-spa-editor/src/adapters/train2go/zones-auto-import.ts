/**
 * Zones auto-import gating.
 *
 * Per the IntegrationPolicy model, Train2Go zones import is governed by
 * an enabled `(dataType: 'training-zones', direction: 'import', mode:
 * 'auto')` policy — not by a per-account flag. These helpers centralise
 * that predicate so both the mount-time import lifecycle and the
 * post-sync/connect fan-out share one source of truth.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";

const TRAINING_ZONES: ManagedDataType = "training-zones";
const TRAIN2GO_SOURCE = "train2go";

export const hasEnabledAutoImportZonesPolicy = async (
  persistence: PersistencePort,
  profileId: string
): Promise<boolean> => {
  const policies = await persistence.integrationPolicy.findByProfileDirection({
    profileId,
    dataType: TRAINING_ZONES,
    direction: "import",
  });
  return policies.some((p) => p.enabled && p.mode === "auto");
};

/**
 * Runs the zones import for `profileId` iff the profile has a linked
 * Train2Go account AND an enabled auto-import training-zones policy.
 * Errors from `runImport` are swallowed so a failed fetch never breaks
 * the mount lifecycle. Returns true when the import was dispatched.
 */
export const maybeAutoImportZones = async (
  persistence: PersistencePort,
  profile: Profile,
  profileId: string,
  runImport: (profileId: string) => Promise<void>
): Promise<boolean> => {
  const hasLink = profile.linkedAccounts.some(
    (a) => a.source === TRAIN2GO_SOURCE
  );
  if (!hasLink) return false;
  if (!(await hasEnabledAutoImportZonesPolicy(persistence, profileId))) {
    return false;
  }
  await runImport(profileId).catch(() => undefined);
  return true;
};
