/**
 * Public turn actions for `useChatTurn`, kept as plain async functions over a
 * context bag so the hook stays thin and this stays unit-testable.
 *
 * send appends the user message, builds the agent, and runs the turn; a
 * `pending_action` result parks the turn for confirmation; approve runs the
 * confirmed tool and resumes; deny resumes with a declined result. The shared
 * engine (apply/run + ctx factory) lives in `chat-turn-context`.
 */
import type { PendingAction } from "@kaiord/ai";
import type { ModelMessage } from "ai";

import {
  appendToolEvent,
  appendUserMessage,
} from "../../application/chat/append-turn-messages";
import { recordsToModelMessages } from "../../application/chat/chat-message-mapper";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { buildChatAgent } from "./build-chat-agent";
import { runAgent } from "./chat-turn-context";
import type { ChatTurnCtx } from "./chat-turn-types";
import { runConfirmedTool } from "./run-confirmed-tool";

export const sendTurn = async (
  ctx: ChatTurnCtx,
  history: ChatMessageRecord[],
  text: string
): Promise<void> => {
  await appendUserMessage(ctx.persistence, ctx.profileId, text);
  await runAgent(ctx, async () => {
    const built = await buildChatAgent({
      persistence: ctx.persistence,
      profileId: ctx.profileId,
      today: ctx.today,
      provider: ctx.provider,
      modelId: ctx.modelId,
      actions: ctx.ops,
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

export const approveAction = async (
  ctx: ChatTurnCtx,
  pending: PendingAction
): Promise<void> => {
  const agent = ctx.agentRef.current;
  if (!agent) return;
  const { output, ok } = await runConfirmedTool(
    ctx.toolsRef.current,
    pending.toolName,
    pending.input
  );
  await appendToolEvent(ctx.persistence, ctx.profileId, pending.toolName, ok);
  ctx.set.pendingAction(null);
  await runAgent(ctx, () =>
    agent.resume(ctx.messagesRef.current, {
      toolCallId: pending.toolCallId,
      toolName: pending.toolName,
      status: "approved",
      output,
    })
  );
};

export const denyAction = async (
  ctx: ChatTurnCtx,
  pending: PendingAction
): Promise<void> => {
  const agent = ctx.agentRef.current;
  if (!agent) return;
  ctx.set.pendingAction(null);
  await runAgent(ctx, () =>
    agent.resume(ctx.messagesRef.current, {
      toolCallId: pending.toolCallId,
      toolName: pending.toolName,
      status: "declined",
    })
  );
};
