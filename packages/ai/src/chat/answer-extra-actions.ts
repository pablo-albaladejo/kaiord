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

const isSameCall = (a: ToolCall, b: ToolCall) =>
  a.toolName === b.toolName &&
  JSON.stringify(a.input) === JSON.stringify(b.input);

/**
 * A step may hold several action calls, but the user confirms one. The others
 * are answered here, so every tool call has a result when the conversation is
 * sent again: the SDK and Anthropic both reject a call with no result. A copy
 * of the pending call is `duplicate_of_pending`; any other is deferred, and
 * `deferredCount` says how many the model was told to ask about again.
 */
export const answerExtraActions = (
  extras: ToolCall[],
  pending: ToolCall
): { messages: ModelMessage[]; deferredCount: number } => {
  if (extras.length === 0) return { messages: [], deferredCount: 0 };
  const results = extras.map((call) => {
    const duplicate = isSameCall(call, pending);
    const value = duplicate ? DUPLICATE_OF_PENDING : ONE_ACTION_AT_A_TIME;
    return { call, duplicate, value };
  });
  const message: ModelMessage = {
    role: "tool",
    content: results.map(({ call, value }) => ({
      type: "tool-result",
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      output: { type: "json", value },
    })),
  };
  const deferredCount = results.filter((r) => !r.duplicate).length;
  return { messages: [message], deferredCount };
};
