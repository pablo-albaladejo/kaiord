/**
 * Dexie Sync State Repository
 *
 * IndexedDB-backed implementation of SyncStateRepository.
 */

import type { SyncStateRepository } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieSyncStateRepository(
  db: KaiordDatabase
): SyncStateRepository {
  const table = () => db.table("syncState");

  return {
    getBySource: async (source) => {
      const result = await table().get(source);
      return result ?? undefined;
    },

    getAll: async () => table().toArray(),

    put: async (state) => {
      await table().put(state);
    },

    delete: async (source) => {
      await table().delete(source);
    },
  };
}
