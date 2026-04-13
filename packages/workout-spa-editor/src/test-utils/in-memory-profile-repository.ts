/**
 * In-Memory Profile Repository
 *
 * Test implementation using a plain Map with active ID tracking.
 */

import type { Profile } from "../types/profile";
import type { ProfileRepository } from "../ports/persistence-port";

export function createInMemoryProfileRepository(): ProfileRepository {
  const store = new Map<string, Profile>();
  let activeId: string | null = null;

  return {
    getAll: async () => [...store.values()],

    getById: async (id) => store.get(id),

    getActiveId: async () => activeId,

    setActiveId: async (id) => {
      activeId = id;
    },

    put: async (profile) => {
      store.set(profile.id, profile);
    },

    delete: async (id) => {
      store.delete(id);
      if (activeId === id) {
        activeId = null;
      }
    },
  };
}
