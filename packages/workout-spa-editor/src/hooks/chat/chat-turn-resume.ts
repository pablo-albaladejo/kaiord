/**
 * Resume actions for a parked chat turn: `approve` runs the confirmed tool,
 * appends a tool-event message, and resumes the agent; `deny` resumes with a
 * declined result without running anything. The confirmed tool runs under
 * the turn's controller, so Stop and leaving the conversation cut it (a
 * health question it waits on, then its generation); an action cut before
 * it ran resumes nothing and closes the turn's Trace as stopped.
 */
import type { PendingAction } from "@kaiord/ai";

import { closeChatTrace, recordAction } from "./chat-trace";
import { resumeWithOutcome } from "./chat-turn-approve";
import { runAgent } from "./chat-turn-context";
import type { ChatTurnCtx } from "./chat-turn-types";
import { runConfirmedTool } from "./run-confirmed-tool";

export const approveAction = async (
  ctx: ChatTurnCtx,
  pending: PendingAction
): Promise<void> => {
  const agent = ctx.agentRef.current;
  if (!agent) return;
  const controller = new AbortController();
  ctx.abortRef.current = controller;
  if (ctx.disposedRef.current) controller.abort();
  const { output, ok } = await runConfirmedTool(
    ctx.toolsRef.current,
    pending.toolName,
    pending.input
  ).finally(() => {
    if (ctx.abortRef.current === controller) ctx.abortRef.current = null;
  });
  // An action cut before it ran is not reported; one that ran is, even after
  // a stop, so the conversation keeps what it did.
  if (controller.signal.aborted && !ok) return stopAction(ctx);
  recordAction(ctx.traceRef, pending.toolName, "athlete", ok ? "ok" : "failed");
  ctx.set.pendingAction(null);
  await runAgent(ctx, (signal) =>
    resumeWithOutcome(ctx, pending, { output, ok }, signal)
  );
};

const stopAction = (ctx: ChatTurnCtx): void => {
  closeChatTrace(ctx.traceRef, "stopped");
  ctx.set.pendingAction(null);
  ctx.set.state("idle");
};

export const denyAction = async (
  ctx: ChatTurnCtx,
  pending: PendingAction
): Promise<void> => {
  const agent = ctx.agentRef.current;
  if (!agent) return;
  recordAction(ctx.traceRef, pending.toolName, "athlete", "refused");
  ctx.set.pendingAction(null);
  await runAgent(ctx, (signal) =>
    agent.resume(
      ctx.messagesRef.current,
      {
        toolCallId: pending.toolCallId,
        toolName: pending.toolName,
        status: "declined",
      },
      { signal }
    )
  );
};
