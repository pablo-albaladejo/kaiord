/**
 * resolveExportPolicies — returns all IntegrationPolicy rows for the
 * given (profileId, dataType) where direction='export', ordered by
 * bridgeId alphabetically for stable UI rendering.
 *
 * Returns all rows (enabled and disabled). Callers decide whether to
 * filter by enabled/mode for their specific affordance.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export type ResolveExportPoliciesInput = {
  profileId: string;
  dataType: ManagedDataType;
};

export const resolveExportPolicies = async (
  deps: IntegrationPolicyDeps,
  input: ResolveExportPoliciesInput
): Promise<IntegrationPolicy[]> => {
  const rows = await deps.policyRepo.findByProfileDirection({
    profileId: input.profileId,
    dataType: input.dataType,
    direction: "export",
  });

  return rows.slice().sort((a, b) => a.bridgeId.localeCompare(b.bridgeId));
};
