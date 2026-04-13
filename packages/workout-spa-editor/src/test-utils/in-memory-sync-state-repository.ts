/**
 * In-Memory Sync State Repository
 *
 * Test implementation using a plain Map keyed by source.
 */

import type { SyncState } from "../types/bridge-schemas";
import type { SyncStateRepository } from "../ports/persistence-port";

export function createInMemorySyncStateRepository(): SyncStateRepository {
  const store = new Map<string, SyncState>();

  return {
    getBySource: async (source) => store.get(source),

    getAll: async () => [...store.values()],

    put: async (state) => {
      store.set(state.source, state);
    },

    delete: async (source) => {
      store.delete(source);
    },
  };
}
