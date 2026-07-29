/**
 * useDataTypeRouting — the Connections page's per-data-type routing rows.
 *
 * `byDataType` is passed in rather than read again: the page already holds one
 * `useDataFlows` subscription, and a second would re-run its 26 queries for
 * the same answer.
 *
 * Freshness bypasses the Data Hub matrix entirely. The rows are per-TYPE and
 * each already resolves at most one source, so the per-source read is the one
 * that fits — and nothing here is stranded when Wave 4 deletes the matrix UI.
 */
import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { useMemo } from "react";

import { bridgeDiscovery } from "../../adapters/bridge/bridge-discovery";
import {
  buildDataTypeRoutingRows,
  type DataTypeRoutingRow,
} from "../../application/connections/data-type-routing";
import { availableSources } from "../../application/connections/data-type-sources";
import {
  buildSourceOfTruthOptions,
  type SourceOfTruthOptions,
} from "../../application/connections/source-of-truth-options";
import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { usePersistence } from "../../contexts/persistence-context";
import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { useBridgeSyncStates } from "../data-hub/use-bridge-sync-states";
import { useDataTypeSourcePolicies } from "../data-hub/use-data-type-source-policies";
import { useBridgeConnections } from "../use-bridge-connections";

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
};

export const useDataTypeRouting = (
  profileId: string | null,
  byDataType: DataFlowsByType
): DataTypeRouting => {
  const persistence = usePersistence();
  const lastSyncedAt = useBridgeSyncStates(persistence, profileId);
  const policies = useDataTypeSourcePolicies(profileId);
  const connections = useBridgeConnections(profileId);

  const rows = useMemo(
    () => buildDataTypeRoutingRows(byDataType, policies),
    [byDataType, policies]
  );

  // Capabilities are read inside the memo, which re-runs whenever a connection
  // row changes — and a row changes exactly when an extension id does, which is
  // the only thing that changes capabilities (same shape as useConnectionSources).
  const options = useMemo(() => {
    const announced = new Map(
      connections.map((row) => [
        row.bridgeId,
        bridgeDiscovery.getCapabilities(row.bridgeId),
      ])
    );
    const signals = {
      capabilitiesFor: (bridgeId: string) => announced.get(bridgeId) ?? null,
      supportsRoute: bridgeSupportsRoute,
    };
    const byType = new Map(policies.map((policy) => [policy.dataType, policy]));
    return new Map(
      managedDataTypes.map((dataType) => [
        dataType,
        buildSourceOfTruthOptions(
          dataType,
          availableSources(byDataType, dataType),
          byType.get(dataType),
          signals
        ),
      ])
    );
  }, [byDataType, policies, connections]);

  return { rows, lastSyncedAt, options };
};
