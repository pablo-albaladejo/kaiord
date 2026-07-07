/**
 * set_data_route — action tool (confirmation-gated) for changing Data Hub
 * routing: enable/disable a (dataType, integration, direction) route, or
 * set a data type's multi-source semantics (union, or a priority order of
 * integrations with automatic fallback). Delegates to the injected
 * `ChatActionOps.setDataRoute`, which wraps the same IntegrationPolicy
 * upsert/delete and DataTypeSourcePolicy write paths the Settings matrix
 * uses — no new write path.
 */
import type { ChatTool } from "@kaiord/ai";
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import { dataTypeSourceModeSchema } from "../../../types/data-type-source-policy";
import { integrationPolicyDirectionSchema } from "../../../types/integration-policy";
import type { ChatActionOps } from "./chat-tool-deps";

const routeFields = {
  dataType: z.enum(managedDataTypes),
  integrationId: z
    .string()
    .min(1)
    .describe("Integration id, e.g. garmin, whoop, train2go, manual"),
  direction: integrationPolicyDirectionSchema,
};

const setDataRouteSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enable_route"), ...routeFields }),
  z.object({ action: z.literal("disable_route"), ...routeFields }),
  z.object({
    action: z.literal("set_source_policy"),
    dataType: z.enum(managedDataTypes),
    mode: dataTypeSourceModeSchema,
    sourceOrder: z
      .array(z.string())
      .optional()
      .describe(
        "Integration ids in priority order, most preferred first. Only " +
          "used when mode is priority; a single id means read only from " +
          "that source (e.g. 'read sleep only from Whoop' -> mode " +
          "priority, sourceOrder ['whoop'])."
      ),
  }),
]);

export const createSetDataRouteTool = (ops: ChatActionOps): ChatTool => ({
  name: "set_data_route",
  description:
    "Change Data Hub routing for the active profile. enable_route / " +
    "disable_route turn a (data type, integration, direction) route on or " +
    "off. set_source_policy sets whether a data type merges every enabled " +
    "source (union, the default) or reads a priority order with automatic " +
    "fallback (priority). Requires the user to confirm before running; " +
    "the result reflects the new persisted state.",
  inputSchema: setDataRouteSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.setDataRoute(setDataRouteSchema.parse(raw)),
});
