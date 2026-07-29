/**
 * useDataTypeRouting — the Connections page's per-data-type routing rows.
 *
 * `byDataType` is passed in rather than read again: the page already holds one
 * `useDataFlows` subscription, and a second would re-run its 26 queries for
 * the same answer.
 *
 * Freshness bypasses the retired routing matrix's derivation entirely. The rows
 * are per-TYPE and each already resolves at most one source, so the per-source
 * read is the one that fits — which is why nothing here was stranded when the
 * matrix UI was retired.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useMemo } from "react";

import type { DataTypeRouteToggle } from "../../application/connections/data-type-route-toggles";
import {
  buildDataTypeRoutingRows,
  type DataTypeRoutingRow,
} from "../../application/connections/data-type-routing";
import {
  optionsByType,
  togglesByType,
} from "../../application/connections/routing-by-type";
import type { SourceOfTruthOptions } from "../../application/connections/source-of-truth-options";
import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { usePersistence } from "../../contexts/persistence-context";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import { useBridgeSyncStates } from "../data-hub/use-bridge-sync-states";
import { useDataTypeSourcePolicies } from "../data-hub/use-data-type-source-policies";
import { useBridgeConnections } from "../use-bridge-connections";
import { useConnectionStatus } from "../use-connection-status";
import { buildRoutingCapabilitySignals } from "./routing-capability-signals";

export type DataTypeRouting = {
  readonly rows: readonly DataTypeRoutingRow[];
  /**
   * Integration id → last sync. `coachingSyncState` is keyed by
   * (source, profile) and never by data type, so this is when that SOURCE last
   * sent Kaiord anything — not when this type last arrived. Every row fed by
   * the same source shows the same instant; the copy has to say so.
   */
  readonly lastSyncedAt: ReadonlyMap<string, string | undefined>;
  readonly options: ReadonlyMap<ManagedDataType, SourceOfTruthOptions>;
  /** Which sources MAY send each type, and whether each is switched on. */
  readonly toggles: ReadonlyMap<
    ManagedDataType,
    readonly DataTypeRouteToggle[]
  >;
};

export const useDataTypeRouting = (
  profileId: string | null,
  byDataType: DataFlowsByType
): DataTypeRouting => {
  const persistence = usePersistence();
  const lastSyncedAt = useBridgeSyncStates(persistence, profileId);
  const policies = useDataTypeSourcePolicies(profileId);
  const connections = useBridgeConnections(profileId);
  const records = useConnectionStatus(profileId);

  const rows = useMemo(
    () => buildDataTypeRoutingRows(byDataType, policies),
    [byDataType, policies]
  );

  // Capabilities are read inside the memo, which re-runs whenever a connection
  // row changes — and a row changes exactly when an extension id does, which is
  // the only thing that changes capabilities (same shape as useConnectionSources).
  const signals = useMemo(
    () => buildRoutingCapabilitySignals(connections, records),
    [connections, records]
  );

  const options = useMemo(
    () => optionsByType(byDataType, policies, signals),
    [byDataType, policies, signals]
  );

  const toggles = useMemo(
    () => togglesByType(byDataType, INTEGRATION_REGISTRY, signals),
    [byDataType, signals]
  );

  return { rows, lastSyncedAt, options, toggles };
};
