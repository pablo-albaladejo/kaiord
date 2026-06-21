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
} from "../../types/chat/chat-message-record";

export const recordsToModelMessages = (
  records: ChatMessageRecord[]
): ModelMessage[] =>
  records
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));

export type NewChatMessageInput = {
  id: string;
  profileId: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  toolName?: string;
  usage?: ChatMessageUsage;
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
  ...(input.usage ? { usage: input.usage } : {}),
});
