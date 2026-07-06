import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import type { ConnectionMechanism } from "../../../types/connection";

export type { ConnectionFlow } from "./flow-availability";

export type ConnectionConfig = {
  id: string;
  name: string;
  mark: string;
  bridgeId: string | null;
  /** How this brand connects: extension bridge, API key, or not yet. */
  mechanism: ConnectionMechanism;
};

// "manual" is excluded here: it has no connect/disconnect affordance on
// this page (it's always active, no bridge) — see the Data Hub matrix
// (F4) for its unified row across every managed data type.
//
// No per-connection `flows` field: `ConnectionFlows`/`flow-availability`
// derive the flow list straight from MANAGED_DATA_REGISTRY intersected
// with the connected bridge's announced capabilities — see
// `deriveConnectionFlows`.
export const CONNECTIONS: readonly ConnectionConfig[] = INTEGRATION_REGISTRY.filter(
  (entry) => entry.mechanism !== "manual"
).map((entry) => ({
  id: entry.id,
  name: entry.name,
  mark: entry.mark,
  bridgeId: entry.bridgeId,
  mechanism: entry.mechanism,
}));
