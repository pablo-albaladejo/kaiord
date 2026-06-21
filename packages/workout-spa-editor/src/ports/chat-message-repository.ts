/**
 * ChatMessageRepository port — the per-profile chat transcript store.
 *
 * Rows are append-only. `deleteByProfile` is the raw bulk clear used by the
 * profile-delete cascade (no tombstones — propagates via the profile
 * tombstone like every other per-profile table). `deleteByConversation` backs
 * the delete-conversation use case, which layers per-message tombstones on top
 * so an explicit single-conversation delete propagates across devices.
 */

import type { ChatMessageRecord } from "../types/chat/chat-message-record";

export type ChatMessageRepository = {
  /** Append one message. Ids are caller-supplied (nanoid). */
  append: (message: ChatMessageRecord) => Promise<void>;
  /**
   * Messages for a profile in ascending `createdAt` order. With `limit`,
   * returns the most recent `limit` messages, still oldest-to-newest.
   */
  listByProfile: (
    profileId: string,
    limit?: number
  ) => Promise<ChatMessageRecord[]>;
  /**
   * Messages for one conversation in ascending `createdAt` order. With
   * `limit`, returns the most recent `limit` messages, still oldest-to-newest.
   */
  listByConversation: (
    profileId: string,
    conversationId: string,
    limit?: number
  ) => Promise<ChatMessageRecord[]>;
  /** Delete every message for one conversation. No-op when none exist. */
  deleteByConversation: (conversationId: string) => Promise<void>;
  /** Bulk-delete every message for a profile. No-op when none exist. */
  deleteByProfile: (profileId: string) => Promise<void>;
};
