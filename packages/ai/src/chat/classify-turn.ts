import type { ChatTurnResult } from "./chat-types";
import type { RawTurn } from "./run-turn";

/**
 * Classifies a raw turn into the engine's outcome, prepending the prior
 * history so `messages` is always the full, resume-ready conversation.
 *
 * - An unanswered action-tool call → `pending_action` (awaiting confirmation).
 * - Otherwise a `tool-calls` finish reason means the step cap halted the loop
 *   while the model still wanted tools → `step_limit`.
 * - Anything else → `complete`.
 */
export const classifyTurn = (
  history: RawTurn["messages"],
  raw: RawTurn,
  actionNames: Set<string>
): ChatTurnResult => {
  const messages = [...history, ...raw.messages];
  const actionCall = raw.toolCalls.find((c) => actionNames.has(c.toolName));

  if (actionCall) {
    return {
      status: "pending_action",
      pendingAction: {
        toolName: actionCall.toolName,
        toolCallId: actionCall.toolCallId,
        input: actionCall.input,
      },
      messages,
    };
  }

  if (raw.finishReason === "tool-calls") {
    return { status: "step_limit", text: raw.text, messages, usage: raw.usage };
  }

  return { status: "complete", text: raw.text, messages, usage: raw.usage };
};
