/**
 * `sendTurn` for `useChatTurn`: ensures the conversation exists (persisting a
 * draft on its first message), appends the user message, asks, if the athlete
 * has not answered for this Provider, whether the assistant may send their
 * health data, builds the agent, and runs the turn. Without health data the
 * health tools read nothing and the earlier answers that used them are not
 * replayed. `retryTurn` re-runs a failed turn whose user message
 * is already persisted, without appending it again.
 */
import type { ModelMessage } from "ai";

import { appendUserMessage } from "../../application/chat/append-turn-messages";
import { recordsToModelMessages } from "../../application/chat/chat-message-mapper";
import { ensureConversationForTurn } from "../../application/chat/ensure-conversation";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { askHealth } from "./chat-health-share";
import { openChatTrace } from "./chat-trace";
import { runAgent } from "./chat-turn-context";
import { buildAndSend } from "./chat-turn-send";
import type { ChatTurnCtx } from "./chat-turn-types";

/** Asks about health data, then replays the history it allows and sends. */
const askAndSend = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  tail: ModelMessage[],
  signal: AbortSignal
) => {
  const trace = openChatTrace(ctx.traceRef, ctx.persistence);
  const healthShared = await askHealth(ctx);
  const replay = recordsToModelMessages(history, {
    withholdHealth: !healthShared,
  });
  return buildAndSend(ctx, {
    messages: [...replay, ...tail],
    signal,
    healthShared,
    trace,
  });
};

export const sendTurn = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  text: string
): Promise<void> => {
  await runAgent(ctx, async (signal) => {
    await ensureConversationForTurn(ctx.persistence, {
      profileId: ctx.profileId,
      conversationId: ctx.conversationId,
      firstMessageText: text,
      model: ctx.pinModel
        ? { providerId: ctx.provider.id, modelId: ctx.modelId }
        : undefined,
    });
    await appendUserMessage(
      ctx.persistence,
      ctx.profileId,
      ctx.conversationId,
      text
    );
    return askAndSend(ctx, history, [{ role: "user", content: text }], signal);
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
  const last = recordsToModelMessages(history).at(-1);
  if (last?.role !== "user" || last.content !== text)
    return sendTurn(ctx, history, text);
  await runAgent(ctx, (signal) => askAndSend(ctx, history, [], signal));
};
