import type { ModelMessage } from "ai";
import type { RawTurn } from "./run-turn";

type ToolCall = RawTurn["toolCalls"][number];

const ONE_ACTION_AT_A_TIME = {
  error: "one_action_at_a_time",
  message:
    "Only one action can be confirmed at a time. This one was not run. " +
    "The user's answer to the action awaiting confirmation applies to that " +
    "action only, not to this one. Ask the user about it again after the " +
    "current action is resolved.",
};

const DUPLICATE_OF_PENDING = {
  error: "duplicate_of_pending",
  message:
    "This is the same action, with the same input, as the one awaiting the " +
    "user's confirmation. It was not run separately. Do not ask for it again.",
};

const DUPLICATE_ACTION = {
  error: "duplicate_action",
  message:
    "This is the same action, with the same input, as another call of this " +
    "step that was already answered. It was not run. Do not ask for it again.",
};

const keyOf = (call: ToolCall) =>
  `${call.toolName}:${JSON.stringify(call.input)}`;

/**
 * A step may hold several action calls, but the user confirms one. The others
 * are answered here, so every tool call has a result when the conversation is
 * sent again: the SDK and Anthropic both reject a call with no result. A copy
 * of the pending call is `duplicate_of_pending`, a copy of an earlier extra is
 * `duplicate_action`, and any other is deferred; `deferredCount` says how many
 * the model was told to ask about again.
 */
export const answerExtraActions = (
  extras: ToolCall[],
  pending: ToolCall
): { messages: ModelMessage[]; deferredCount: number } => {
  if (extras.length === 0) return { messages: [], deferredCount: 0 };
  const pendingKey = keyOf(pending);
  const seen = new Set([pendingKey]);
  let deferredCount = 0;
  const content = extras.map((call) => {
    const key = keyOf(call);
    let value = ONE_ACTION_AT_A_TIME;
    if (key === pendingKey) value = DUPLICATE_OF_PENDING;
    else if (seen.has(key)) value = DUPLICATE_ACTION;
    else deferredCount++;
    seen.add(key);
    return {
      type: "tool-result" as const,
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      output: { type: "json" as const, value },
    };
  });
  return { messages: [{ role: "tool", content }], deferredCount };
};
