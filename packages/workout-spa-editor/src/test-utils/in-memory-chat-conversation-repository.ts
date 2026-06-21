/**
 * In-memory ChatConversationRepository.
 *
 * Mirrors the Dexie implementation for unit tests without IndexedDB. The
 * store Map is externally owned so `createInMemoryPersistence` can
 * snapshot/restore it inside the transaction wrapper.
 */
import type { ChatConversationRepository } from "../ports/chat-conversation-repository";
import type { ChatConversationRecord } from "../types/chat/chat-conversation-record";

export function createInMemoryChatConversationRepository(
  store: Map<string, ChatConversationRecord> = new Map()
): ChatConversationRepository {
  return {
    put: async (conversation) => {
      store.set(conversation.id, conversation);
    },
    get: async (profileId, id) => {
      const row = store.get(id);
      return row && row.profileId === profileId ? row : undefined;
    },
    listByProfile: async (profileId) =>
      [...store.values()]
        .filter((c) => c.profileId === profileId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    delete: async (id) => {
      store.delete(id);
    },
    deleteByProfile: async (profileId) => {
      for (const [id, c] of store) {
        if (c.profileId === profileId) store.delete(id);
      }
    },
  };
}
