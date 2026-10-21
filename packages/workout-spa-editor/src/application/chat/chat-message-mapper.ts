/**
 * Maps between persisted chat records and the AI SDK message shape.
 *
 * Only user/assistant turns are replayed into the model context — tool-event
 * records are display-only, and each turn re-runs tools fresh, so they carry
 * no value as prior context and would not round-trip to `ModelMessage` tool
 * parts cleanly. `newChatMessage` is a pure factory: the caller injects the
 * id and timestamp so persistence stays deterministic and testable.
 */
import type { ModelMessage } from "ai";

import type {
  ChatMessageRecord,
  ChatMessageRole,
  ChatMessageUsage,
  ChatStopReason,
} from "../../types/chat/chat-message-record";

/** Model-facing only (never rendered): tells the model its earlier reply was
 * cut short, so it does not build on it as if finished. */
const MODEL_STOP_MARKERS: Record<ChatStopReason, string> = {
  aborted: "(Stopped by the user.)",
  timeout: "(Stopped: the response took too long.)",
};

const modelContent = (r: ChatMessageRecord): string =>
  r.stopReason
    ? [r.content, MODEL_STOP_MARKERS[r.stopReason]].filter(Boolean).join("\n\n")
    : r.content;

export const recordsToModelMessages = (
  records: ChatMessageRecord[]
): ModelMessage[] =>
  records
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: modelContent(r),
    }));

export type NewChatMessageInput = {
  id: string;
  profileId: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  toolName?: string;
  toolResult?: unknown;
  usage?: ChatMessageUsage;
  stopReason?: ChatStopReason;
};

export const newChatMessage = (
  input: NewChatMessageInput
): ChatMessageRecord => ({
  id: input.id,
  profileId: input.profileId,
  conversationId: input.conversationId,
  role: input.role,
  content: input.content,
  createdAt: input.createdAt,
  ...(input.toolName ? { toolName: input.toolName } : {}),
  ...(input.toolResult !== undefined ? { toolResult: input.toolResult } : {}),
  ...(input.usage ? { usage: input.usage } : {}),
  ...(input.stopReason ? { stopReason: input.stopReason } : {}),
});
