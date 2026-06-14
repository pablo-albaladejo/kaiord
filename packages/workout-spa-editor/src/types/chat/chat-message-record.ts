/**
 * Chat transcript record.
 *
 * One persisted message in a profile's rolling chat conversation. Rows are
 * append-only and immutable; `createdAt` is an ISO-8601 string so the
 * cross-device snapshot merge clock (`recordClock`) applies without an
 * `updatedAt` field. Profile-scoped via `profileId` + `[profileId+createdAt]`.
 */

export type ChatMessageRole = "user" | "assistant" | "tool";

export type ChatMessageUsage = {
  promptTokens: number;
  completionTokens: number;
};

export type ChatMessageRecord = {
  id: string;
  profileId: string;
  role: ChatMessageRole;
  /** Plain-text content (assistant/user) or a tool-event summary line. */
  content: string;
  /** Set on tool-event entries: the tool that produced the entry. */
  toolName?: string;
  /** ISO-8601 timestamp; merge clock and chronological sort key. */
  createdAt: string;
  /** Provider-reported token usage, present on completed assistant turns. */
  usage?: ChatMessageUsage;
};
