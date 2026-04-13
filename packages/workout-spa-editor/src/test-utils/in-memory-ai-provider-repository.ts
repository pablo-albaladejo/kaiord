/**
 * In-Memory AI Provider Repository
 *
 * Test implementation using a plain Map.
 */

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { AiProviderRepository } from "../ports/persistence-port";

export function createInMemoryAiProviderRepository(): AiProviderRepository {
  const store = new Map<string, LlmProviderConfig>();

  return {
    getAll: async () => [...store.values()],

    getById: async (id) => store.get(id),

    put: async (provider) => {
      store.set(provider.id, provider);
    },

    delete: async (id) => {
      store.delete(id);
    },
  };
}
