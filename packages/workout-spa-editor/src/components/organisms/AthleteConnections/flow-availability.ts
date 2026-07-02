import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { ConnectionFlow } from "./connection-config";

export type FlowAvailability = "operational" | "manual" | "coming-soon";

/** Required bridge capability token for a flow, sourced from the single
    domain registry — never hardcoded per flow, so a newly-announced
    capability (e.g. F4.1 adding read:body/read:sleep) makes the matching
    flow operational without any UI change. */
function requiredCapability(flow: ConnectionFlow): string | undefined {
  return MANAGED_DATA_REGISTRY[flow.dataType].capabilities[flow.direction];
}

/** Whether a flow is backed by the connected bridge's verified
    capabilities. Import flows without backend fall back to the existing
    manual FIT-import path ("manual"); export flows without backend have no
    manual equivalent, so they're flagged "coming-soon". Never returns
    "operational" unless the bridge actually announced the capability. */
export function flowAvailability(
  flow: ConnectionFlow,
  capabilities: readonly string[]
): FlowAvailability {
  const required = requiredCapability(flow);
  if (required !== undefined && capabilities.includes(required)) {
    return "operational";
  }
  return flow.direction === "import" ? "manual" : "coming-soon";
}
