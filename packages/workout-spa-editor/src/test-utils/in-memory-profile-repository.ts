/**
 * In-Memory Profile Repository
 *
 * Test implementation using a plain Map with active ID tracking.
 * Accepts externally-owned store and activeId ref so
 * `createInMemoryPersistence` can snapshot both for transaction
 * rollback.
 */

import type { Profile } from "../types/profile";
import type { ProfileRepository } from "../ports/persistence-port";

export type ActiveIdRef = { current: string | null };

export function createInMemoryProfileRepository(
  store: Map<string, Profile> = new Map(),
  activeIdRef: ActiveIdRef = { current: null }
): ProfileRepository {
  return {
    getAll: async () => [...store.values()],

    getById: async (id) => store.get(id),

    getActiveId: async () => activeIdRef.current,

    setActiveId: async (id) => {
      activeIdRef.current = id;
    },

    put: async (profile) => {
      store.set(profile.id, profile);
    },

    delete: async (id) => {
      store.delete(id);
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
      }
    },

    count: async () => store.size,
  };
}
