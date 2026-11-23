/**
 * set_authority — action Tool (confirmation-gated) that records the athlete's
 * own choice of Authority for one kind of data: a priority order with
 * automatic fallback, or every source kept (union). Owned by the
 * `authority-matrix` Capability, so it is offered only while that is on.
 * Delegates to the injected `ChatActionOps.setAuthority`, which writes the
 * same DataTypeSourcePolicy row the matrix writes. What the description
 * says decides each kind with nothing chosen is pinned to the App's rule
 * (`authorityInForce`) by set-authority-tool.test.ts.
 */
import type { ChatTool } from "@kaiord/ai";

import type { ChatActionOps } from "./chat-tool-deps";
import { setAuthorityInputSchema } from "./set-authority-schema";

export const createSetAuthorityTool = (ops: ChatActionOps): ChatTool => ({
  name: "set_authority",
  description:
    "Choose which source decides a kind of data for the active profile, " +
    "overriding the App's automatic choice. mode priority reads sourceOrder " +
    "with automatic fallback; mode union keeps and shows every source. With " +
    "nothing chosen, the App decides by itself (the athlete's own entries " +
    "first, then a fixed order of Platforms) for: training-zones, weight, " +
    "sleep, hrv, daily-wellness, body-composition, stress, strain, vitals, " +
    "heart-rate-series; and keeps every source for: workout, " +
    "planned-session, activity. Requires the user to confirm before " +
    "running; the result reflects the new persisted state.",
  inputSchema: setAuthorityInputSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.setAuthority(setAuthorityInputSchema.parse(raw)),
});
