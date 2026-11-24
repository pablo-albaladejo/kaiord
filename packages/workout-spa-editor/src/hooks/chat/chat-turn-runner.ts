/**
 * `sendTurn` for `useChatTurn`: ensures the conversation exists (persisting a
 * draft on its first message), appends the user message, asks, if the athlete
 * has not answered for this Provider, whether the assistant may send their
 * health data, builds the agent, and runs the turn. Without health data the
 * health tools read nothing and the earlier answers that used them are not
 * replayed. `retryTurn` re-runs a failed turn whose user message
 * is already persisted, without appending it again.
 */
import type { ChatTurnResult } from "@kaiord/ai";
import type { ModelMessage } from "ai";

import { appendUserMessage } from "../../application/chat/append-turn-messages";
import { recordsToModelMessages } from "../../application/chat/chat-message-mapper";
import { ensureConversationForTurn } from "../../application/chat/ensure-conversation";
import { firstHealthBearingReply } from "../../application/chat/turn-read-health";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { askHealth } from "./chat-health-share";
import { closeChatTrace, openChatTrace } from "./chat-trace";
import { runAgent } from "./chat-turn-context";
import { buildAndSend } from "./chat-turn-send";
import type { ChatTurnCtx } from "./chat-turn-types";

/** What a turn stopped while the athlete was asked leaves: nothing sent. */
const STOPPED_BEFORE_SENDING: ChatTurnResult = {
  status: "aborted",
  text: "",
  messages: [],
  toolNames: [],
};

/** Asks about health data, then replays the history it allows and sends. */
const askAndSend = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  tail: ModelMessage[],
  signal: AbortSignal
): Promise<ChatTurnResult> => {
  const trace = openChatTrace(ctx.traceRef, ctx.persistence);
  let healthShared: boolean;
  try {
    healthShared = await askHealth(ctx, signal, trace);
  } catch (error) {
    if (!signal.aborted) throw error;
    closeChatTrace(ctx.traceRef, "stopped");
    return STOPPED_BEFORE_SENDING;
  }
  const replay = recordsToModelMessages(history, {
    withholdHealth: !healthShared,
  });
  const historyHealth = healthShared && firstHealthBearingReply(history) >= 0;
  return buildAndSend(ctx, {
    messages: [...replay, ...tail],
    signal,
    healthShared,
    historyHealth,
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
