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

/** Why an assistant reply ended early: stopped by the user, or timed out. */
export type ChatStopReason = "aborted" | "timeout";

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
  /**
   * Set on an assistant reply cut short. `content` then holds only what
   * streamed; the transcript renders the reason localized, and the replay
   * to the model appends a fixed marker (see `recordsToModelMessages`).
   */
  stopReason?: ChatStopReason;
  /**
   * On an assistant reply: whether its turn ran a tool that reads stored
   * health data (stopped or not), so it may quote it. Every new reply stores
   * it, `false` included; absent (a reply stored or synced by an older build)
   * means unknown and counts as true. A replay to a Provider the athlete does
   * not share health data with leaves out every reply from the first one that
   * may quote it.
   */
  readHealth?: boolean;
};
