/**
 * get_data_routes — read tool (auto-executed) answering "where do my X
 * come from / go to" for the active profile. Reuses `buildDataHubMatrix`
 * (same derivation as the Settings matrix) so this is never a second
 * source of truth; `getMatrixSignals` is injected so this stays adapter
 * and React-free (see hooks/chat/build-data-route-signals.ts).
 */
import type { ChatTool } from "@kaiord/ai";
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";
import {
  buildDataHubMatrix,
  type DataHubMatrixSignals,
} from "../../data-hub/build-data-hub-matrix";
import type { ReadToolDeps } from "./chat-tool-deps";
import { buildDataRouteAnswer } from "./data-route-answer";

const inputSchema = z.object({
  dataType: z
    .enum(managedDataTypes)
    .optional()
    .describe(
      "Restrict to one managed data type, e.g. planned-session, activity, " +
        "or sleep. Omit to return every data type."
    ),
});

export type GetDataRoutesDeps = ReadToolDeps & {
  /** One-shot snapshot of the live matrix signals (bridge discovery,
      connections, IntegrationPolicy rows, Train2Go freshness). */
  getMatrixSignals: () => Promise<DataHubMatrixSignals>;
};

export const createGetDataRoutesTool = (deps: GetDataRoutesDeps): ChatTool => ({
  name: "get_data_routes",
  description:
    "Read the Data Hub routing for the active profile: which integration " +
    "each data type (planned sessions, activities, workouts, health " +
    "metrics, ...) is imported from or exported to, whether the route is " +
    "enabled, its multi-source semantics (union or priority order), " +
    "freshness (last synced), and — for health metrics — today's " +
    "effective source. Use it for questions like 'where do my planned " +
    "sessions come from' or 'what syncs to Garmin'.",
  inputSchema,
  requiresConfirmation: false,
  execute: async (raw) => {
    const input = inputSchema.parse(raw);
    const signals = await deps.getMatrixSignals();
    const rows = buildDataHubMatrix(INTEGRATION_REGISTRY, signals).filter(
      (row) => !input.dataType || row.dataType === input.dataType
    );
    const dataTypes = await Promise.all(
      rows.map((row) =>
        buildDataRouteAnswer(row, {
          persistence: deps.persistence,
          profileId: deps.profileId,
          today: deps.today,
        })
      )
    );
    return { day: deps.today, dataTypes };
  },
});
