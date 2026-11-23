import { healthSharingGate } from "../../lib/health-sharing-gate";
import type { ChatTurnCtx } from "./chat-turn-types";

/** Whether this turn may carry the athlete's health data to its Provider. */
export const askHealth = async (ctx: ChatTurnCtx): Promise<boolean> =>
  (await healthSharingGate.request({
    flow: "assistant",
    providerType: ctx.provider.type,
  })) === "send";
