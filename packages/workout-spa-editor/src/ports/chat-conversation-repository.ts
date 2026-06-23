/**
 * ChatConversationRepository port — the per-profile conversation store.
 *
 * Conversation rows are mutable (rename, model override, `updatedAt`
 * advancing on activity), so the snapshot merge resolves concurrent edits
 * last-write-wins on `updatedAt`. `deleteByProfile` is the raw bulk clear for
 * the profile-delete cascade (propagates via the profile tombstone); the
 * delete-conversation use case layers a `[chatConversations+id]` tombstone on
 * top of `delete` so an explicit single-conversation delete propagates across
 * devices. Read-modify-write semantics (rename/touch/set-model) live in the
 * application layer, composed from `get` + `put` inside a transaction.
 */

import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";

export type ChatConversationRepository = {
  /** Upsert a conversation. Ids are caller-supplied (nanoid). */
  put: (conversation: ChatConversationRecord) => Promise<void>;
  /** One conversation by id (profile-scoped), or `undefined` when absent. */
  get: (
    profileId: string,
    id: string
  ) => Promise<ChatConversationRecord | undefined>;
  /** A profile's conversations, most-recently-updated first. */
  listByProfile: (profileId: string) => Promise<ChatConversationRecord[]>;
  /** Delete one conversation row. No-op when absent. */
  delete: (id: string) => Promise<void>;
  /** Bulk-delete every conversation for a profile (profile-delete cascade). */
  deleteByProfile: (profileId: string) => Promise<void>;
};
