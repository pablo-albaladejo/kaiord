/**
 * Dexie ChatMessageRepository.
 *
 * Backed by the `chatMessages` store. The `[profileId+createdAt]` index
 * serves the per-profile read (cascade + whole-profile); the v24
 * `[profileId+conversationId+createdAt]` index serves the active-thread
 * read. `limit` slices the newest tail while preserving ascending order.
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
    listByConversation: async (profileId, conversationId, limit) => {
      const all = await table()
        .where("[profileId+conversationId+createdAt]")
        .between(
          [profileId, conversationId, ""],
          [profileId, conversationId, "￿"],
          true,
          true
        )
        .toArray();
      return limit !== undefined ? all.slice(-limit) : all;
    },
    deleteByConversation: async (conversationId) => {
      await table().where("conversationId").equals(conversationId).delete();
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
