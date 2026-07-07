import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import type { ConnectionMechanism } from "../../../types/connection";

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
// No per-connection `flows` field: routing (what syncs, per data type and
// direction) is owned exclusively by the Data Hub matrix (F4.2) — this
// catalog only carries connect/disconnect identity.
export const CONNECTIONS: readonly ConnectionConfig[] =
  INTEGRATION_REGISTRY.filter((entry) => entry.mechanism !== "manual").map(
    (entry) => ({
      id: entry.id,
      name: entry.name,
      mark: entry.mark,
      bridgeId: entry.bridgeId,
      mechanism: entry.mechanism,
    })
  );
