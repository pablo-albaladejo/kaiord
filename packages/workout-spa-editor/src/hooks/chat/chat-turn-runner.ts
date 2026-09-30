/**
 * `sendTurn` for `useChatTurn`: ensures the conversation exists (persisting a
 * draft on its first message), appends the user message, builds the agent, and
 * runs the turn. `retryTurn` re-runs a failed turn whose user message is
 * already persisted, without appending it again.
 */
import type { ModelMessage } from "ai";

import { appendUserMessage } from "../../application/chat/append-turn-messages";
import { recordsToModelMessages } from "../../application/chat/chat-message-mapper";
import { ensureConversationForTurn } from "../../application/chat/ensure-conversation";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { buildChatAgent } from "./build-chat-agent";
import { buildDataRouteSignals } from "./build-data-route-signals";
import { runAgent } from "./chat-turn-context";
import type { ChatTurnCtx } from "./chat-turn-types";

const buildAndSend = async (ctx: ChatTurnCtx, messages: ModelMessage[]) => {
  const built = await buildChatAgent({
    persistence: ctx.persistence,
    profileId: ctx.profileId,
    today: ctx.today,
    provider: ctx.provider,
    modelId: ctx.modelId,
    actions: ctx.ops,
    getMatrixSignals: () =>
      buildDataRouteSignals(ctx.persistence, ctx.profileId),
    onTextDelta: (d) => ctx.set.streamingText((p) => p + d),
  });
  ctx.agentRef.current = built.agent;
  ctx.toolsRef.current = built.tools;
  return built.agent.sendTurn(messages);
};

export const sendTurn = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  text: string
): Promise<void> => {
  await runAgent(ctx, async () => {
    await ensureConversationForTurn(ctx.persistence, {
      profileId: ctx.profileId,
      conversationId: ctx.conversationId,
      firstMessageText: text,
      model: { providerId: ctx.provider.id, modelId: ctx.modelId },
    });
    await appendUserMessage(
      ctx.persistence,
      ctx.profileId,
      ctx.conversationId,
      text
    );
    return buildAndSend(ctx, [
      ...recordsToModelMessages(history),
      { role: "user", content: text },
    ]);
  });
};

/**
 * Retries the last turn. A failed `sendTurn` has usually already persisted
 * the user message, so it is part of `history` — re-sending it through
 * `sendTurn` would append (and send) it a second time. When the replayable
 * history already ends with that exact user message, re-run the agent on it
 * as-is; otherwise (the failure happened before the append) send it.
 */
export const retryTurn = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  text: string
): Promise<void> => {
  const replay = recordsToModelMessages(history);
  const last = replay.at(-1);
  if (last?.role !== "user" || last.content !== text)
    return sendTurn(ctx, history, text);
  await runAgent(ctx, () => buildAndSend(ctx, replay));
};
