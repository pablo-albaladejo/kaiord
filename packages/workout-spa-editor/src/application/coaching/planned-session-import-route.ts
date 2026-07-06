/**
 * Shared predicate for the planned-session import route (F1.3). A Train2Go
 * sync is governed by an enabled `(planned-session, import)` policy — the kill
 * test. Centralised so the sync gate (`syncWeek`) and the UI freshness/route
 * indicator read the exact same rule. Filters on `enabled` only: mode is a
 * separate axis (auto vs manual), while enabled is the on/off route switch.
 */
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";

const PLANNED_SESSION = "planned-session";

export const hasEnabledPlannedSessionImportRoute = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<boolean> => {
  const policies = await policyRepo.findByProfileDirection({
    profileId,
    dataType: PLANNED_SESSION,
    direction: "import",
  });
  return policies.some((p) => p.enabled);
};
