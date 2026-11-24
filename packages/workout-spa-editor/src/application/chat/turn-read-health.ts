import type { ChatTurnResult } from "@kaiord/ai";

import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import { HEALTH_READING_TOOLS } from "./tools/health-reading-tools";

/**
 * Whether a turn ran a tool that reads stored health data: one its result
 * names (a stop drops the calls from `messages`, never from `toolNames`), or
 * a call still in `messages` (an earlier segment of a turn resumed after an
 * action). The replayed history holds plain text only, so every tool call in
 * `messages` is this turn's own.
 */
export const turnReadHealth = (
  result: Pick<ChatTurnResult, "messages" | "toolNames">
): boolean =>
  result.toolNames.some((name) => HEALTH_READING_TOOLS.has(name)) ||
  result.messages.some(
    (message) =>
      message.role === "assistant" &&
      Array.isArray(message.content) &&
      message.content.some(
        (part) =>
          part.type === "tool-call" && HEALTH_READING_TOOLS.has(part.toolName)
      )
  );

/**
 * Whether a stored assistant reply may quote health data: it read some, or
 * it was stored before replies said (`readHealth` absent counts as yes).
 */
export const replyMayHoldHealth = (record: ChatMessageRecord): boolean =>
  record.role === "assistant" && record.readHealth !== false;

/**
 * The index of the first reply in `records` that may quote health data, or
 * -1. Every assistant reply from there on may repeat it without a tool call,
 * so all of them count as health-bearing (the conservative rule).
 */
export const firstHealthBearingReply = (records: ChatMessageRecord[]): number =>
  records.findIndex(replyMayHoldHealth);
