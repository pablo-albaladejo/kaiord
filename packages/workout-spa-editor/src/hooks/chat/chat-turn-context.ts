/**
 * Internal engine for the chat turn runner: applies a settled turn result to
 * state/persistence and wraps a turn run with streaming + error handling.
 * Context types + factory live in `chat-turn-types`.
 */
import type { ChatTurnResult } from "@kaiord/ai";

import { appendAssistantTurn } from "../../application/chat/append-turn-messages";
import { categorizeChatError } from "./chat-error";
import { autoApprove, isAutoApproved } from "./chat-turn-approve";
import type { ChatTurnCtx } from "./chat-turn-types";

const applyResult = async (
  ctx: ChatTurnCtx,
  result: ChatTurnResult,
  signal: AbortSignal
): Promise<void> => {
  ctx.messagesRef.current = result.messages;
  if (result.status === "pending_action") {
    // A stopped turn never starts the push; it falls back to the card.
    if (isAutoApproved(result.pendingAction) && !signal.aborted) {
      const next = await autoApprove(ctx, result.pendingAction, signal);
      return applyResult(ctx, next, signal);
    }
    ctx.set.pendingAction(result.pendingAction);
    ctx.set.state("awaiting_confirmation");
    return;
  }
  ctx.set.pendingAction(null);
  await appendAssistantTurn(
    ctx.persistence,
    ctx.profileId,
    ctx.conversationId,
    result
  );
  ctx.set.streamingText("");
  ctx.set.state("idle");
};

/**
 * Runs one turn under a fresh `AbortController` held in `abortRef`, so
 * {@link stopTurn} can cut it short. A stopped turn resolves (status
 * `aborted` / `timeout`) and is persisted like any other reply.
 */
export const runAgent = async (
  ctx: ChatTurnCtx,
  run: (signal: AbortSignal) => Promise<ChatTurnResult>
): Promise<void> => {
  const controller = new AbortController();
  ctx.abortRef.current = controller;
  if (ctx.disposedRef.current) controller.abort();
  ctx.set.error(null);
  ctx.set.state("streaming");
  ctx.set.streamingText("");
  try {
    await applyResult(ctx, await run(controller.signal), controller.signal);
  } catch (e) {
    ctx.set.streamingText("");
    ctx.set.state("error");
    ctx.set.error(categorizeChatError(e));
  } finally {
    if (ctx.abortRef.current === controller) ctx.abortRef.current = null;
  }
};

/** Stops the in-flight turn, if any; a no-op once it has settled. */
export const stopTurn = (ctx: ChatTurnCtx): void => {
  ctx.abortRef.current?.abort();
};
