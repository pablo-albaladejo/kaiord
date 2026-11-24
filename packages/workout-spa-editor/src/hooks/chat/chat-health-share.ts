import type { TraceRun } from "../../application/trace/trace-run";
import { healthSharingGate } from "../../lib/health-sharing-gate";
import type { ChatTurnCtx } from "./chat-turn-types";

/**
 * Whether this turn may carry the athlete's health data to its Provider.
 * While the athlete is asked, the turn's Trace is kept as stopped, so a page
 * closed then still leaves it; a Stop then rejects as aborted.
 */
export const askHealth = async (
  ctx: ChatTurnCtx,
  signal: AbortSignal,
  trace: TraceRun
): Promise<boolean> =>
  (await healthSharingGate.request(
    { flow: "assistant", providerType: ctx.provider.type },
    { signal, onWait: () => void trace.checkpoint() }
  )) === "send";
