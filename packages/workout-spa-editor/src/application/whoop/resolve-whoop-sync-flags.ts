/**
 * Resolves which WHOOP-derived data types have an enabled import policy for
 * the profile, gating each one BEFORE `syncWhoopCycles` ever touches the
 * bridge. Split out of sync-whoop-cycles.use-case.ts to keep that file under
 * the per-file line cap.
 */
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";
import type { WhoopSyncFlags } from "./whoop-sync-flags";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";

const isEnabled = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string,
  dataType: "hrv" | "sleep" | "strain" | "vitals"
): Promise<boolean> => {
  const policies = await resolveImportPolicies(
    { policyRepo },
    { profileId, dataType }
  );
  return policies.some((p) => p.enabled && p.bridgeId === WHOOP_BRIDGE_SOURCE);
};

export const resolveWhoopSyncFlags = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<WhoopSyncFlags> => ({
  hrv: await isEnabled(policyRepo, profileId, "hrv"),
  sleep: await isEnabled(policyRepo, profileId, "sleep"),
  strain: await isEnabled(policyRepo, profileId, "strain"),
  vitals: await isEnabled(policyRepo, profileId, "vitals"),
});
