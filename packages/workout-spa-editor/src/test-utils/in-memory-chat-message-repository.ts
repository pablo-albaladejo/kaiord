/**
 * In-memory ChatMessageRepository.
 *
 * Mirrors the Dexie implementation for unit tests without IndexedDB. The
 * store Map is externally owned so `createInMemoryPersistence` can
 * snapshot/restore it inside the transaction wrapper.
 */
import type { ChatMessageRepository } from "../ports/chat-message-repository";
import type { ChatMessageRecord } from "../types/chat/chat-message-record";

export function createInMemoryChatMessageRepository(
  store: Map<string, ChatMessageRecord> = new Map()
): ChatMessageRepository {
  return {
    append: async (message) => {
      store.set(message.id, message);
    },
    listByProfile: async (profileId, limit) => {
      const all = [...store.values()]
        .filter((m) => m.profileId === profileId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return limit !== undefined ? all.slice(-limit) : all;
    },
    listByConversation: async (profileId, conversationId, limit) => {
      const all = [...store.values()]
        .filter(
          (m) =>
            m.profileId === profileId && m.conversationId === conversationId
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return limit !== undefined ? all.slice(-limit) : all;
    },
    deleteByConversation: async (conversationId) => {
      for (const [id, m] of store) {
        if (m.conversationId === conversationId) store.delete(id);
      }
    },
    deleteByProfile: async (profileId) => {
      for (const [id, m] of store) {
        if (m.profileId === profileId) store.delete(id);
      }
    },
  };
}
