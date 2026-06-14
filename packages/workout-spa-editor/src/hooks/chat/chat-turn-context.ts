/**
 * Internal engine for the chat turn runner: applies a settled turn result to
 * state/persistence and wraps a turn run with streaming + error handling.
 * Context types + factory live in `chat-turn-types`.
 */
import type { ChatTurnResult } from "@kaiord/ai";

import { appendAssistantTurn } from "../../application/chat/append-turn-messages";
import { categorizeChatError } from "./chat-error";
import type { ChatTurnCtx } from "./chat-turn-types";

const applyResult = async (
  ctx: ChatTurnCtx,
  result: ChatTurnResult
): Promise<void> => {
  ctx.messagesRef.current = result.messages;
  if (result.status === "pending_action") {
    ctx.set.pendingAction(result.pendingAction);
    ctx.set.state("awaiting_confirmation");
    return;
  }
  ctx.set.pendingAction(null);
  await appendAssistantTurn(
    ctx.persistence,
    ctx.profileId,
    result,
    ctx.provider.type
  );
  ctx.set.streamingText("");
  ctx.set.state("idle");
};

export const runAgent = async (
  ctx: ChatTurnCtx,
  run: () => Promise<ChatTurnResult>
): Promise<void> => {
  ctx.set.error(null);
  ctx.set.state("streaming");
  ctx.set.streamingText("");
  try {
    await applyResult(ctx, await run());
  } catch (e) {
    ctx.set.streamingText("");
    ctx.set.state("error");
    ctx.set.error(categorizeChatError(e));
  }
};
