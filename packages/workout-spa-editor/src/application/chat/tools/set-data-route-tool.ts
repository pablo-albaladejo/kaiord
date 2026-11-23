/**
 * set_data_route — action Tool (confirmation-gated) that switches one
 * (data type, integration, direction) route on or off: whether a source is
 * read at all, not which one decides (that is `set_authority`). Offered
 * whatever Capabilities are on. Delegates to the injected
 * `ChatActionOps.setDataRoute`, which wraps the same IntegrationPolicy upsert
 * the Connections page's switches use.
 */
import type { ChatTool } from "@kaiord/ai";

import type { ChatActionOps } from "./chat-tool-deps";
import { setDataRouteInputSchema } from "./set-data-route-schema";

export const createSetDataRouteTool = (ops: ChatActionOps): ChatTool => ({
  name: "set_data_route",
  description:
    "Switch one source on or off for a kind of data on the active profile: " +
    "enable_route / disable_route turn a (data type, integration, " +
    "direction) route on or off, so that source's data is imported (or " +
    "sent) or not. It does not choose which source decides when several " +
    "report the same kind. Requires the user to confirm before running; " +
    "the result reflects the new persisted state.",
  inputSchema: setDataRouteInputSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.setDataRoute(setDataRouteInputSchema.parse(raw)),
});
