/**
 * resolveImportPolicies — returns all IntegrationPolicy rows for the
 * given (profileId, dataType) where direction='import', ordered by
 * bridgeId alphabetically for stable UI rendering.
 *
 * Returns all rows (enabled and disabled). Callers decide whether to
 * filter by enabled/mode for their specific affordance.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export type ResolveImportPoliciesInput = {
  profileId: string;
  dataType: ManagedDataType;
};

export const resolveImportPolicies = async (
  deps: IntegrationPolicyDeps,
  input: ResolveImportPoliciesInput
): Promise<IntegrationPolicy[]> => {
  const rows = await deps.policyRepo.findByProfileDirection({
    profileId: input.profileId,
    dataType: input.dataType,
    direction: "import",
  });

  return rows.slice().sort((a, b) => a.bridgeId.localeCompare(b.bridgeId));
};
