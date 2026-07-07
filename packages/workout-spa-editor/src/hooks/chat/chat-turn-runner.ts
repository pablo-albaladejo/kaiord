/**
 * `sendTurn` for `useChatTurn`: ensures the conversation exists (persisting a
 * draft on its first message), appends the user message, builds the agent, and
 * runs the turn.
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
    const messages: ModelMessage[] = [
      ...recordsToModelMessages(history),
      { role: "user", content: text },
    ];
    return built.agent.sendTurn(messages);
  });
};
