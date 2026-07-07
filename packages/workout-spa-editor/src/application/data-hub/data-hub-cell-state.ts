/**
 * Cell-state derivation for the Data Hub matrix (F4.1). Split out of
 * `build-data-hub-matrix.ts` to keep both files under the per-file line cap.
 * Every state is derived from injected live signals — never guessed.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";
import type { IntegrationPolicyDirection } from "../../types/integration-policy";

export type DataHubCellState =
  | "active"
  | "available"
  | "not-operational"
  | "not-connected"
  | "aspirational"
  | "manual"
  | "na";

export type DataHubMatrixSignals = {
  /** Real provider linked (v24 connections store, status="connected"). */
  isConnected: (integrationId: string) => boolean;
  /** Bridge extension currently discovered/announcing anything. */
  isBridgeOnline: (bridgeId: string) => boolean;
  /** Bridge currently announces the wire token for this flow. */
  bridgeAnnounces: (bridgeId: string, token: string) => boolean;
  /** An enabled IntegrationPolicy exists for this exact route. */
  isRouteEnabled: (
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection,
    bridgeId: string
  ) => boolean;
  lastSyncedAt: (integrationId: string) => string | undefined;
};

const bridgeCellState = (
  entry: IntegrationRegistryEntry,
  token: string,
  s: DataHubMatrixSignals,
  dataType: ManagedDataType,
  direction: IntegrationPolicyDirection
): DataHubCellState => {
  if (!s.isConnected(entry.id)) return "not-connected";
  const bridgeId = entry.bridgeId;
  if (bridgeId === null) return "na";
  if (!s.isBridgeOnline(bridgeId)) return "not-operational";
  if (!s.bridgeAnnounces(bridgeId, token)) return "na";
  return s.isRouteEnabled(dataType, direction, bridgeId)
    ? "active"
    : "available";
};

export const cellState = (
  entry: IntegrationRegistryEntry,
  token: string,
  direction: IntegrationPolicyDirection,
  s: DataHubMatrixSignals,
  dataType: ManagedDataType
): DataHubCellState => {
  switch (entry.mechanism) {
    case "manual":
      // Only types with a REAL manual-entry code path (MANUAL_ENTRY_TYPES) —
      // not every importable token; planned-session has no manual authoring.
      return direction === "import" && MANUAL_ENTRY_TYPES.has(dataType)
        ? "manual"
        : "na";
    case "not-supported":
      return "aspirational";
    case "api-key":
      // No cabled flows for the sole api-key provider (intervals.icu) yet;
      // the column header still surfaces its connection state.
      return s.isConnected(entry.id) ? "na" : "not-connected";
    case "bridge":
      return bridgeCellState(entry, token, s, dataType, direction);
    default:
      return "na";
  }
};
