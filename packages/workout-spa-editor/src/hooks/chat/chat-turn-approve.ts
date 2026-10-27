import type { ChatTurnResult, PendingAction } from "@kaiord/ai";

import { appendToolEvent } from "../../application/chat/append-turn-messages";
import type { ChatTurnCtx } from "./chat-turn-types";
import { runConfirmedTool } from "./run-confirmed-tool";

/**
 * Action tools the athlete has chosen to run without a confirmation card.
 * They still pause the agent like every action tool, so the call is
 * recorded as a tool event and fed back on resume exactly as an approval.
 */
export const AUTO_APPROVED_TOOLS: ReadonlySet<string> = new Set([
  "push_to_garmin",
]);

export const isAutoApproved = (pending: PendingAction): boolean =>
  AUTO_APPROVED_TOOLS.has(pending.toolName);

type ToolOutcome = { output: unknown; ok: boolean };

/** Records the approved call's outcome and resumes the agent with it. */
export const resumeWithOutcome = async (
  ctx: ChatTurnCtx,
  pending: PendingAction,
  { output, ok }: ToolOutcome,
  signal: AbortSignal
): Promise<ChatTurnResult> => {
  const agent = ctx.agentRef.current;
  if (!agent) throw new Error("No chat agent");
  await appendToolEvent(
    ctx.persistence,
    ctx.profileId,
    ctx.conversationId,
    pending.toolName,
    ok,
    output
  );
  return agent.resume(
    ctx.messagesRef.current,
    {
      toolCallId: pending.toolCallId,
      toolName: pending.toolName,
      status: "approved",
      output,
    },
    { signal }
  );
};

/** Runs an auto-approved action and resumes, as if the user had approved. */
export const autoApprove = async (
  ctx: ChatTurnCtx,
  pending: PendingAction,
  signal: AbortSignal
): Promise<ChatTurnResult> => {
  const outcome = await runConfirmedTool(
    ctx.toolsRef.current,
    pending.toolName,
    pending.input
  );
  return resumeWithOutcome(ctx, pending, outcome, signal);
};
