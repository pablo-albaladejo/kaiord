import type { ChatTurnResult, PendingAction } from "@kaiord/ai";

import { appendToolEvent } from "../../application/chat/append-turn-messages";
import type { ChatTurnCtx } from "./chat-turn-types";

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
