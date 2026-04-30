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
    getAll: async () => [...store.values()],

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
