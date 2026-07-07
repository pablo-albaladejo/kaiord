/**
 * buildDataRouteAnswer — one managed-data-type's routing state, shared by
 * the `get_data_routes` read tool and the `set_data_route` confirmation
 * result. Reuses the exact Data Hub matrix cell derivation and the F3.2
 * multi-source resolver — the chat answer is never a second source of
 * truth against the Settings matrix.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { PersistencePort } from "../../../ports/persistence-port";
import type {
  IntegrationPolicyDirection,
  IntegrationPolicyMode,
} from "../../../types/integration-policy";
import type {
  DataHubCellState,
  DataHubRow,
} from "../../data-hub/build-data-hub-matrix";
import {
  type EffectiveSourceAnswer,
  getEffectiveSourceToday,
} from "./effective-source-today";

export type DataRouteEntry = {
  integrationId: string;
  direction: IntegrationPolicyDirection;
  state: DataHubCellState;
  enabled: boolean;
  mode?: IntegrationPolicyMode;
  lastSyncedAt?: string;
};

export type DataRouteAnswer = {
  dataType: ManagedDataType;
  label: string;
  routes: DataRouteEntry[];
  sourcePolicy: { mode: "union" | "priority"; sourceOrder: string[] };
  effectiveSourceToday?: EffectiveSourceAnswer;
};

export type DataRouteAnswerDeps = {
  persistence: PersistencePort;
  profileId: string;
  today: string;
};

export const buildDataRouteAnswer = async (
  row: DataHubRow,
  deps: DataRouteAnswerDeps
): Promise<DataRouteAnswer> => {
  const sourcePolicy =
    await deps.persistence.dataTypeSourcePolicy.findByProfileAndType({
      profileId: deps.profileId,
      dataType: row.dataType,
    });
  return {
    dataType: row.dataType,
    label: row.label,
    routes: row.cells
      .filter((cell) => cell.state !== "na")
      .map((cell) => ({
        integrationId: cell.integrationId,
        direction: cell.direction,
        state: cell.state,
        enabled: cell.enabled,
        mode: cell.routeMode,
        lastSyncedAt: cell.lastSyncedAt,
      })),
    sourcePolicy: {
      mode: sourcePolicy?.mode ?? "union",
      sourceOrder: sourcePolicy?.sourceOrder ?? [],
    },
    effectiveSourceToday: await getEffectiveSourceToday(
      deps.persistence,
      deps.profileId,
      row.dataType,
      deps.today
    ),
  };
};
