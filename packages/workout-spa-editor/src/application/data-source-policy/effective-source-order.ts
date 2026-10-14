/**
 * The source order a "priority" read actually consults:
 * `sourceOrder ∩ enabled import policies`. "manual" has no bridge or
 * policy row and is always active, so it is never filtered out.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import type { DataTypeSourcePolicyRepository } from "./data-type-source-policy-repository.port";

const MANUAL_SOURCE_BRIDGE_ID = "manual";

export const effectiveSourceOrder = (
  sourceOrder: readonly string[],
  importPolicies: readonly IntegrationPolicy[]
): string[] => {
  const enabled = new Set(
    importPolicies.filter((p) => p.enabled).map((p) => p.bridgeId)
  );
  return sourceOrder.filter(
    (bridgeId) => bridgeId === MANUAL_SOURCE_BRIDGE_ID || enabled.has(bridgeId)
  );
};

export type SourceOrderDeps = {
  sourcePolicyRepo: DataTypeSourcePolicyRepository;
  policyRepo: IntegrationPolicyRepository;
};

/** The consulted order for a "priority" policy; empty under "union". */
export const loadEffectiveSourceOrder = async (
  deps: SourceOrderDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<string[]> => {
  const policy = await deps.sourcePolicyRepo.findByProfileAndType(input);
  if (policy?.mode !== "priority") return [];
  const importPolicies = await deps.policyRepo.findByProfileDirection({
    ...input,
    direction: "import",
  });
  return effectiveSourceOrder(policy.sourceOrder, importPolicies);
};
