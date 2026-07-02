/**
 * Resume actions for a parked chat turn: `approve` runs the confirmed tool,
 * appends a tool-event message, and resumes the agent; `deny` resumes with a
 * declined result without running anything.
 */
import type { PendingAction } from "@kaiord/ai";

import { appendToolEvent } from "../../application/chat/append-turn-messages";
import { runAgent } from "./chat-turn-context";
import type { ChatTurnCtx } from "./chat-turn-types";
import { runConfirmedTool } from "./run-confirmed-tool";

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
  ctx.set.pendingAction(null);
  await runAgent(ctx, async () => {
    await appendToolEvent(
      ctx.persistence,
      ctx.profileId,
      ctx.conversationId,
      pending.toolName,
      ok,
      output
    );
    return agent.resume(ctx.messagesRef.current, {
      toolCallId: pending.toolCallId,
      toolName: pending.toolName,
      status: "approved",
      output,
    });
  });
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
