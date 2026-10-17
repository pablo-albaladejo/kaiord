import type { ModelMessage } from "ai";
import type { RawTurn } from "./run-turn";

type ToolCall = RawTurn["toolCalls"][number];

const ONE_ACTION_AT_A_TIME = {
  error: "one_action_at_a_time",
  message:
    "Only one action can be confirmed at a time. This one was not run. " +
    "Ask the user about it again after the current action is resolved.",
};

/**
 * A step may hold several action calls, but the user confirms one. The others
 * are answered here, so every tool call has a result when the conversation is
 * sent again: the SDK and Anthropic both reject a call with no result.
 * Returns no message when there is nothing to answer.
 */
export const answerExtraActions = (extras: ToolCall[]): ModelMessage[] =>
  extras.length === 0
    ? []
    : [
        {
          role: "tool",
          content: extras.map((call) => ({
            type: "tool-result",
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            output: { type: "json", value: ONE_ACTION_AT_A_TIME },
          })),
        },
      ];
