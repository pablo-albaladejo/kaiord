import type { ModelMessage } from "ai";

import { HEALTH_READING_TOOLS } from "./tools/health-reading-tools";

/**
 * Whether a turn called a tool that reads stored health data. The replayed
 * history holds plain text only, so every tool call in `messages` is this
 * turn's own.
 */
export const turnReadHealth = (messages: ModelMessage[]): boolean =>
  messages.some(
    (message) =>
      message.role === "assistant" &&
      Array.isArray(message.content) &&
      message.content.some(
        (part) =>
          part.type === "tool-call" && HEALTH_READING_TOOLS.has(part.toolName)
      )
  );
