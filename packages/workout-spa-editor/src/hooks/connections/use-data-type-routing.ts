/**
 * useDataTypeRouting — the Connections page's per-data-type routing rows.
 *
 * `byDataType` is passed in rather than read again: the page already holds one
 * `useDataFlows` subscription, and a second would re-run its 26 queries for
 * the same answer.
 *
 * Freshness is read per source: each row resolves at most one source.
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
import { AUTHORITY_MATRIX_ID } from "../../application/data-source-policy/automatic-authority";
import { useCapabilities } from "../../contexts/capabilities-context";
import { usePersistence } from "../../contexts/persistence-context";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { useBridgeSyncStates } from "../data-hub/use-bridge-sync-states";
import { useDataTypeSourcePolicies } from "../data-hub/use-data-type-source-policies";
import { useBridgeConnections } from "../use-bridge-connections";
import { useConnectionStatus } from "../use-connection-status";
import { buildRoutingCapabilitySignals } from "./routing-capability-signals";
import type { DataFlowsByType } from "./use-data-flows";

export type DataTypeRouting = {
  readonly rows: readonly DataTypeRoutingRow[];
  /** Integration id → when that SOURCE last sent anything (not this type). */
  readonly lastSyncedAt: ReadonlyMap<string, string | undefined>;
  readonly options: ReadonlyMap<ManagedDataType, SourceOfTruthOptions>;
  /** Which sources MAY send each type, and whether each is switched on. */
  readonly toggles: ReadonlyMap<
    ManagedDataType,
    readonly DataTypeRouteToggle[]
  >;
  /** Which destinations MAY receive each type, and whether each is on. */
  readonly exportToggles: ReadonlyMap<
    ManagedDataType,
    readonly DataTypeRouteToggle[]
  >;
};

const NO_CHOICES: readonly DataTypeSourcePolicy[] = [];

export const useDataTypeRouting = (
  profileId: string | null,
  byDataType: DataFlowsByType
): DataTypeRouting => {
  const persistence = usePersistence();
  const lastSyncedAt = useBridgeSyncStates(persistence, profileId);
  const stored = useDataTypeSourcePolicies(profileId);
  // A choice applies only while the matrix is on (`readAuthorityChoice`).
  const matrixOn = useCapabilities().isOn(AUTHORITY_MATRIX_ID);
  const policies = matrixOn ? stored : NO_CHOICES;
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

  const exportToggles = useMemo(
    () => togglesByType(byDataType, INTEGRATION_REGISTRY, signals, "export"),
    [byDataType, signals]
  );

  return { rows, lastSyncedAt, options, toggles, exportToggles };
};
