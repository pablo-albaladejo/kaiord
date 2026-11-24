import type { ModelMessage } from "ai";

import { healthKindsOf } from "../../application/data-flows/data-flows";
import type { TraceRun } from "../../application/trace/trace-run";
import { buildChatAgent } from "./build-chat-agent";
import { buildDataRouteSignals } from "./build-data-route-signals";
import type { ChatTurnCtx } from "./chat-turn-types";

type Send = {
  messages: ModelMessage[];
  signal: AbortSignal;
  healthShared: boolean;
  /** The replayed history holds replies that may quote health data. */
  historyHealth: boolean;
  trace: TraceRun;
};

/**
 * Builds the turn's agent over its Trace and sends the turn. The Trace
 * counts the messages here and each read Tool's kinds as it runs; health
 * data earlier replies may quote is declared, since it cannot be counted.
 */
export const buildAndSend = async (
  ctx: ChatTurnCtx,
  { messages, signal, healthShared, historyHealth, trace }: Send
) => {
  const built = await buildChatAgent({
    trace,
    persistence: ctx.persistence,
    profileId: ctx.profileId,
    today: ctx.today,
    provider: ctx.provider,
    modelId: ctx.modelId,
    actions: ctx.ops,
    healthShared,
    getMatrixSignals: () =>
      buildDataRouteSignals(ctx.persistence, ctx.profileId),
    onTextDelta: (d) => ctx.set.streamingText((p) => p + d),
  });
  ctx.agentRef.current = built.agent;
  ctx.toolsRef.current = built.tools;
  const declared = historyHealth ? healthKindsOf("assistant") : [];
  trace.sent(ctx.provider.type, ["messages"], declared);
  return built.agent.sendTurn(messages, { signal });
};
