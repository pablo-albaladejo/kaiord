/**
 * set_data_route — action tool (confirmation-gated) for changing data
 * routing: enable/disable a (dataType, integration, direction) route, or
 * set a data type's multi-source semantics (union, or a priority order of
 * integrations with automatic fallback). Delegates to the injected
 * `ChatActionOps.setDataRoute`, which wraps the same IntegrationPolicy upsert
 * and DataTypeSourcePolicy write paths the Connections page's routing rows use
 * — no new write path.
 */
import type { ChatTool } from "@kaiord/ai";

import type { ChatActionOps } from "./chat-tool-deps";
import { setDataRouteInputSchema } from "./set-data-route-schema";

export const createSetDataRouteTool = (ops: ChatActionOps): ChatTool => ({
  name: "set_data_route",
  description:
    "Change data routing for the active profile. enable_route / " +
    "disable_route turn a (data type, integration, direction) route on or " +
    "off. set_source_policy sets whether a data type merges every enabled " +
    "source (union, the default) or reads a priority order with automatic " +
    "fallback (priority). Requires the user to confirm before running; " +
    "the result reflects the new persisted state.",
  inputSchema: setDataRouteInputSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.setDataRoute(setDataRouteInputSchema.parse(raw)),
});
