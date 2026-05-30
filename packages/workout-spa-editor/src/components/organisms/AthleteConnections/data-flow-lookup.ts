import type { IntegrationPolicy } from "../../../types/integration-policy";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import type { ConnectionFlow } from "./connection-config";

/** All policies on a bridge, across every data type and direction. */
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

/** True when an enabled policy exists for the flow's (dataType, direction)
    on the given bridge — drives the flow toggle's checked state. */
export function isFlowEnabled(
  byDataType: DataFlowsByType,
  flow: ConnectionFlow,
  bridgeId: string
): boolean {
  const group = byDataType.get(flow.dataType);
  const policies = group?.[flow.direction] ?? [];
  return policies.some(
    (policy) => policy.bridgeId === bridgeId && policy.enabled
  );
}
