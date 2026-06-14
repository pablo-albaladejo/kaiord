/**
 * Dexie ChatMessageRepository.
 *
 * Backed by the v20 `chatMessages` store. The `[profileId+createdAt]`
 * compound index serves the chronological per-profile read; `limit` slices
 * the newest tail while preserving ascending order.
 */
import type { ChatMessageRepository } from "../../ports/chat-message-repository";
import type { ChatMessageRecord } from "../../types/chat/chat-message-record";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieChatMessageRepository(
  db: KaiordDatabase
): ChatMessageRepository {
  const table = () => db.table<ChatMessageRecord>("chatMessages");
  return {
    append: async (message) => {
      await table().put(message);
    },
    listByProfile: async (profileId, limit) => {
      const all = await table()
        .where("[profileId+createdAt]")
        .between([profileId, ""], [profileId, "￿"], true, true)
        .toArray();
      return limit !== undefined ? all.slice(-limit) : all;
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
