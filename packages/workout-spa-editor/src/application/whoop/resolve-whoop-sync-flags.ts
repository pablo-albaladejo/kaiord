/**
 * Resolves which WHOOP-derived data types have an enabled import policy for
 * the profile, gating each one BEFORE `syncWhoopCycles` ever touches the
 * bridge.
 */
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { isRouteEnabled } from "../integration-policy/is-route-enabled";
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
  return isRouteEnabled(policies, WHOOP_BRIDGE_SOURCE);
};

export const resolveWhoopSyncFlags = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<WhoopSyncFlags> => {
  // The four policy lookups are independent — resolve them concurrently.
  const [hrv, sleep, strain, vitals] = await Promise.all([
    isEnabled(policyRepo, profileId, "hrv"),
    isEnabled(policyRepo, profileId, "sleep"),
    isEnabled(policyRepo, profileId, "strain"),
    isEnabled(policyRepo, profileId, "vitals"),
  ]);
  return { hrv, sleep, strain, vitals };
};
