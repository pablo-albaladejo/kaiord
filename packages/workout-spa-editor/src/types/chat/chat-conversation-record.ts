/**
 * Chat conversation record.
 *
 * One persisted conversation thread for a profile — the parent of
 * `chatMessages` rows via their `conversationId`. Unlike messages,
 * conversation rows are mutable: `title` is renamed and `updatedAt`
 * advances on every append/rename, so the cross-device merge clock
 * (`recordClock`) resolves concurrent edits last-write-wins on
 * `updatedAt`. Profile-scoped via `profileId` + `[profileId+updatedAt]`.
 * Optional `providerId`/`modelId` hold the per-conversation model
 * override; when unset the turn falls back to `resolveModelForPurpose`.
 */

export type ChatConversationRecord = {
  id: string;
  profileId: string;
  /** Auto-derived from the first user message; user-renamable. */
  title: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601; advances on rename/append. Merge clock + list sort key. */
  updatedAt: string;
  /** Per-conversation model override (provider id); unset → chat default. */
  providerId?: string;
  /** Per-conversation model override (model id); unset → chat default. */
  modelId?: string;
};
