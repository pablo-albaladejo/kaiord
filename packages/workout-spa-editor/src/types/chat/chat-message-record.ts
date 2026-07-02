/**
 * Chat transcript record.
 *
 * One persisted message in a conversation thread. Rows are append-only and
 * immutable; `createdAt` is an ISO-8601 string so the cross-device snapshot
 * merge clock (`recordClock`) applies without an `updatedAt` field.
 * Profile-scoped via `profileId`; bucketed into a thread via `conversationId`
 * and read through `[profileId+conversationId+createdAt]`.
 */

export type ChatMessageRole = "user" | "assistant" | "tool";

export type ChatMessageUsage = {
  promptTokens: number;
  completionTokens: number;
};

export type ChatMessageRecord = {
  id: string;
  profileId: string;
  /** Parent conversation thread (FK into `chatConversations`). */
  conversationId: string;
  role: ChatMessageRole;
  /** Plain-text content (assistant/user) or a tool-event summary line. */
  content: string;
  /** Set on tool-event entries: the tool that produced the entry. */
  toolName?: string;
  /**
   * Set on successful tool-event entries: the tool's raw execution result
   * (e.g. `{ workoutId, date }` for `create_workout`), so the transcript can
   * render a deep-link without re-deriving it from `content`.
   */
  toolResult?: unknown;
  /** ISO-8601 timestamp; merge clock and chronological sort key. */
  createdAt: string;
  /** Provider-reported token usage, present on completed assistant turns. */
  usage?: ChatMessageUsage;
};
