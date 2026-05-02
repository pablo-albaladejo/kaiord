/**
 * In-Memory AI Provider Repository
 *
 * Test implementation using a plain Map. Accepts an externally-owned
 * store so `createInMemoryPersistence` can snapshot it for transaction
 * rollback. The custom-prompt slot is held in a ref so it participates
 * in the same snapshot/revert cycle.
 */

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { AiProviderRepository } from "../ports/persistence-port";

export type CustomPromptRef = { current: string | null };

export function createInMemoryAiProviderRepository(
  store: Map<string, LlmProviderConfig> = new Map(),
  customPromptRef: CustomPromptRef = { current: null }
): AiProviderRepository {
  return {
    // Mirror the Dexie adapter's orderBy("createdAt") contract so use-case
    // tests against this fake see the same insertion-order guarantees the
    // SPA sees against IndexedDB. UUID-pk ordering is forbidden here for
    // the same reason it was forbidden there.
    getAll: async () =>
      [...store.values()].sort((a, b) => a.createdAt - b.createdAt),

    getById: async (id) => store.get(id),

    put: async (provider) => {
      store.set(provider.id, provider);
    },

    delete: async (id) => {
      store.delete(id);
    },

    getCustomPrompt: async () => customPromptRef.current,

    setCustomPrompt: async (prompt) => {
      customPromptRef.current = prompt;
    },
  };
}
