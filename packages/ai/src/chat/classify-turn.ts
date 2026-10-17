import { answerExtraActions } from "./answer-extra-actions";
import type { ChatTurnResult } from "./chat-types";
import type { RawTurn } from "./run-turn";

/**
 * Classifies a raw turn into the engine's outcome, prepending the prior
 * history so `messages` is always the full, resume-ready conversation.
 *
 * - An unanswered action-tool call → `pending_action` (awaiting confirmation).
 *   The first one of the step wins, the order the model proposed them in
 *   (calls whose input failed validation were already answered and are not
 *   here). Other action calls of that step are answered (see
 *   `answerExtraActions`): deferred ones are counted in `deferredCount`.
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
  const actionCalls = raw.toolCalls.filter((c) => actionNames.has(c.toolName));
  const actionCall = actionCalls[0];

  if (actionCall) {
    const extras = answerExtraActions(actionCalls.slice(1), actionCall);
    messages.push(...extras.messages);
    return {
      status: "pending_action",
      pendingAction: {
        toolName: actionCall.toolName,
        toolCallId: actionCall.toolCallId,
        input: actionCall.input,
        ...(extras.deferredCount > 0 && {
          deferredCount: extras.deferredCount,
        }),
      },
      messages,
    };
  }

  if (raw.finishReason === "tool-calls") {
    return { status: "step_limit", text: raw.text, messages, usage: raw.usage };
  }

  return { status: "complete", text: raw.text, messages, usage: raw.usage };
};
