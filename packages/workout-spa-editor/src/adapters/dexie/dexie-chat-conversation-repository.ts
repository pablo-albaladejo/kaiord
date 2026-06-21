/**
 * Dexie ChatConversationRepository.
 *
 * Backed by the v24 `chatConversations` store. The `[profileId+updatedAt]`
 * compound index serves the most-recently-updated-first list; `get` is
 * profile-scoped so a deep link can never resolve another profile's row.
 */
import type { ChatConversationRepository } from "../../ports/chat-conversation-repository";
import type { ChatConversationRecord } from "../../types/chat/chat-conversation-record";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieChatConversationRepository(
  db: KaiordDatabase
): ChatConversationRepository {
  const table = () => db.table<ChatConversationRecord>("chatConversations");
  return {
    put: async (conversation) => {
      await table().put(conversation);
    },
    get: async (profileId, id) => {
      const row = await table().get(id);
      return row && row.profileId === profileId ? row : undefined;
    },
    listByProfile: (profileId) =>
      table()
        .where("[profileId+updatedAt]")
        .between([profileId, ""], [profileId, "￿"], true, true)
        .reverse()
        .toArray(),
    delete: async (id) => {
      await table().delete(id);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
