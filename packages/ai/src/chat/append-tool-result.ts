import type { JSONValue, ModelMessage } from "ai";
import type { ToolResolution } from "./chat-types";

/**
 * Appends the tool-result message that resolves a pending action, so the next
 * turn can resume from the same conversation. An approval carries the use
 * case's output; a denial carries a sentinel the model is instructed to treat
 * as "the user declined this action".
 */
export const appendToolResult = (
  messages: ModelMessage[],
  resolution: ToolResolution
): ModelMessage[] => {
  const value: JSONValue =
    resolution.status === "approved"
      ? (resolution.output as JSONValue)
      : { declined: true, reason: "The user declined this action." };

  const toolMessage: ModelMessage = {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: resolution.toolCallId,
        toolName: resolution.toolName,
        output: { type: "json", value },
      },
    ],
  };

  return [...messages, toolMessage];
};
