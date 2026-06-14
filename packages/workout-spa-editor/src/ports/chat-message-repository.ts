/**
 * ChatMessageRepository port — the per-profile chat transcript store.
 *
 * Rows are append-only. `deleteByProfile` is the raw bulk clear used by the
 * profile-delete cascade (no tombstones — propagates via the profile
 * tombstone like every other per-profile table). The clear-conversation use
 * case layers per-message tombstones on top of `deleteByProfile` so an
 * explicit clear (which keeps the profile) propagates across devices.
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
  /** Bulk-delete every message for a profile. No-op when none exist. */
  deleteByProfile: (profileId: string) => Promise<void>;
};
