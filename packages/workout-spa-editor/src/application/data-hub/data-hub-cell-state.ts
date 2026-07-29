/**
 * Cell-state derivation for the Data Hub matrix. Every state is derived
 * from injected live signals — never guessed.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";
import type {
  IntegrationPolicyDirection,
  IntegrationPolicyMode,
} from "../../types/integration-policy";

export type DataHubCellState =
  "active" | "available" | "not-connected" | "aspirational" | "manual" | "na";

export type DataHubMatrixSignals = {
  /** api-key provider linked (v24 connections store, status="connected"). */
  isConnected: (integrationId: string) => boolean;
  /**
   * Bridge linked AND its extension discovered. Both halves matter: the
   * connections store only ever holds a `disconnected` row for a bridge (no
   * code path writes `connected` on install), so discovery alone would ignore
   * an explicit unlink and a record alone would report every working bridge
   * as absent. `isBridgeConnected` in application/connections owns the rule;
   * this signal and the Connections page's cards both call it, so a column
   * header and a cell can no longer disagree about the same bridge.
   */
  isBridgeConnected: (bridgeId: string) => boolean;
  /** Bridge currently announces the wire token for this flow. */
  bridgeAnnounces: (bridgeId: string, token: string) => boolean;
  /** An enabled IntegrationPolicy exists for this exact route. */
  isRouteEnabled: (
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection,
    bridgeId: string
  ) => boolean;
  lastSyncedAt: (integrationId: string) => string | undefined;
  /**
   * The existing route (id + persisted mode) for this exact
   * (dataType, direction, bridgeId), regardless of enabled — undefined when
   * no policy row exists yet. Backs the matrix's mode-edit/remove menu
   * (F4.2): a disabled "available" cell can still have a row (and a mode)
   * from before it was toggled off.
   */
  findRoute: (
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection,
    bridgeId: string
  ) => { id: string; mode: IntegrationPolicyMode } | undefined;
  /**
   * Narrows an announced-but-shared token (read:body spans weight, hrv,
   * daily-wellness, body-composition and stress) to the routes the SPA
   * actually serves. REQUIRED so the compiler enumerates every construction
   * site — an optional field lets a caller silently bypass the filter.
   */
  supportsRoute: (
    bridgeId: string,
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection
  ) => boolean;
};

const bridgeCellState = (
  entry: IntegrationRegistryEntry,
  token: string,
  s: DataHubMatrixSignals,
  dataType: ManagedDataType,
  direction: IntegrationPolicyDirection
): DataHubCellState => {
  const bridgeId = entry.bridgeId;
  if (bridgeId === null) return "na";
  // Support is a STATIC property of the bridge, not of its session, so this
  // precedes the online check: a route the bridge can never serve reads "na"
  // whether or not the extension happens to be running.
  if (!s.supportsRoute(bridgeId, dataType, direction)) return "na";
  if (!s.isBridgeConnected(bridgeId)) return "not-connected";
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
