/**
 * Dexie Profile Repository
 *
 * IndexedDB-backed implementation of ProfileRepository.
 * Uses a `meta` table for activeProfileId storage.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

const ACTIVE_PROFILE_KEY = "activeProfileId";

export function createDexieProfileRepository(
  db: KaiordDatabase
): ProfileRepository {
  const table = () => db.table("profiles");
  const meta = () => db.table("meta");

  return {
    getAll: async () => table().toArray(),

    getById: async (id) => {
      const result = await table().get(id);
      return result ?? undefined;
    },

    getActiveId: async () => {
      const row = await meta().get(ACTIVE_PROFILE_KEY);
      return row?.value ?? null;
    },

    setActiveId: async (id) => {
      await meta().put({ key: ACTIVE_PROFILE_KEY, value: id });
    },

    put: async (profile) => {
      await table().put(profile);
    },

    delete: async (id) => {
      // Delete profile first, then clear activeId if it matched.
      // Not wrapped in a Dexie transaction to avoid TS2589 deep type
      // instantiation. Acceptable for single-user SPA — the race window
      // between delete and activeId clear is negligible.
      await table().delete(id);
      const row = await meta().get(ACTIVE_PROFILE_KEY);
      if (row?.value === id) {
        await meta().put({ key: ACTIVE_PROFILE_KEY, value: null });
      }
    },
  };
}
