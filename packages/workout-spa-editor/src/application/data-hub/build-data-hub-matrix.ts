/**
 * build-data-hub-matrix — pure assembly of the Data Hub matrix (F4.1).
 *
 * Rows = the managed data types (registry labels); columns = the
 * INTEGRATION_REGISTRY entries; each applicable (dataType, integration,
 * direction) is one cell whose state is derived by `cellState` (see
 * data-hub-cell-state) — never guessed. Pure: all live signals are injected,
 * so the hook layer wires Dexie/discovery and this stays unit-testable.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type {
  IntegrationPolicyDirection,
  IntegrationPolicyMode,
} from "../../types/integration-policy";
import { cellState, type DataHubMatrixSignals } from "./data-hub-cell-state";

export type {
  DataHubCellState,
  DataHubMatrixSignals,
} from "./data-hub-cell-state";

export type DataHubCell = {
  integrationId: string;
  direction: IntegrationPolicyDirection;
  state: ReturnType<typeof cellState>;
  /** True only for `active`; drives the toggle's checked state. */
  enabled: boolean;
  /** ISO timestamp of the last successful sync, when the source has one. */
  lastSyncedAt?: string;
  /** Existing route id (active or disabled-available) — undefined when no
      policy row exists yet. Backs the mode-edit/remove menu (F4.2). */
  routeId?: string;
  /** The route's persisted mode, when it exists. */
  routeMode?: IntegrationPolicyMode;
};

export type DataHubRow = {
  dataType: ManagedDataType;
  label: string;
  cells: DataHubCell[];
};

/** Shared cell-callback shapes (F4.2), threaded through DataHubTab →
    DataHubMatrix → DataHubMatrixRow → DataHubCell — kept here so those
    components each stay a one-line prop type instead of repeating the
    full signature under the per-file line cap. */
export type DataHubToggleHandler = (
  dataType: ManagedDataType,
  bridgeId: string,
  cell: DataHubCell
) => void;
export type DataHubSetModeHandler = (
  dataType: ManagedDataType,
  bridgeId: string,
  cell: DataHubCell,
  mode: IntegrationPolicyMode
) => void;
export type DataHubRemoveHandler = (routeId: string) => void;

const DIRECTIONS: readonly IntegrationPolicyDirection[] = ["import", "export"];

export const buildDataHubMatrix = (
  integrations: readonly IntegrationRegistryEntry[],
  signals: DataHubMatrixSignals
): DataHubRow[] =>
  managedDataTypes.map((dataType) => {
    const entry = MANAGED_DATA_REGISTRY[dataType];
    const cells: DataHubCell[] = [];
    for (const direction of DIRECTIONS) {
      const token = entry.capabilities[direction];
      if (token === undefined) continue;
      for (const integration of integrations) {
        const state = cellState(
          integration,
          token,
          direction,
          signals,
          dataType
        );
        const route = integration.bridgeId
          ? signals.findRoute(dataType, direction, integration.bridgeId)
          : undefined;
        cells.push({
          integrationId: integration.id,
          direction,
          state,
          enabled: state === "active",
          lastSyncedAt:
            state === "active"
              ? signals.lastSyncedAt(integration.id)
              : undefined,
          routeId: route?.id,
          routeMode: route?.mode,
        });
      }
    }
    return { dataType, label: entry.label, cells };
  });
