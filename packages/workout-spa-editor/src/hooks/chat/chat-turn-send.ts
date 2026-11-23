import type { ModelMessage } from "ai";

import { kindsSent } from "../../application/data-flows/kinds-sent";
import type { TraceRun } from "../../application/trace/trace-run";
import { buildChatAgent } from "./build-chat-agent";
import { buildDataRouteSignals } from "./build-data-route-signals";
import type { ChatTurnCtx } from "./chat-turn-types";

type Send = {
  messages: ModelMessage[];
  signal: AbortSignal;
  healthShared: boolean;
  trace: TraceRun;
};

/** Builds the turn's agent over its Trace and sends the turn. */
export const buildAndSend = async (
  ctx: ChatTurnCtx,
  { messages, signal, healthShared, trace }: Send
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
  trace.sent(ctx.provider.type, kindsSent("assistant", healthShared));
  return built.agent.sendTurn(messages, { signal });
};
