import type { DataFlowsByType } from "../../../hooks/connections/use-data-flows";
import type { IntegrationPolicy } from "../../../types/integration-policy";

/** All policies on a bridge, across every data type and direction. Backs
    disconnect (disables every policy on the bridge being unlinked). */
export function bridgePolicies(
  byDataType: DataFlowsByType,
  bridgeId: string
): IntegrationPolicy[] {
  const all: IntegrationPolicy[] = [];
  for (const group of byDataType.values()) {
    all.push(...group.import, ...group.export);
  }
  return all.filter((policy) => policy.bridgeId === bridgeId);
}
