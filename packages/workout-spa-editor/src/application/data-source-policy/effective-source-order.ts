/**
 * The source order a "priority" read actually consults:
 * `sourceOrder ∩ enabled import policies`. "manual" has no bridge or
 * policy row and is always active, so it is never filtered out.
 */
import type { IntegrationPolicy } from "../../types/integration-policy";
import { MANUAL_SOURCE_BRIDGE_ID } from "../import/stamp-provenance";

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
