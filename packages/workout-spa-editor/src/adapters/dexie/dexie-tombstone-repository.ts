/**
 * Dexie Tombstone Repository
 *
 * IndexedDB-backed implementation of TombstoneRepository on the v19
 * `tombstones` store (PK `[table+id]`).
 */

import type { TombstoneRepository } from "../../ports/persistence-port";
import type { Tombstone } from "../../types/snapshot";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieTombstoneRepository(
  db: KaiordDatabase
): TombstoneRepository {
  const table = () => db.table("tombstones");

  return {
    put: async (tombstone) => {
      await table().put(tombstone);
    },

    get: async (tableName, id) => {
      const result = (await table().get([tableName, id])) as
        | Tombstone
        | undefined;
      return result ?? undefined;
    },

    list: async () => (await table().toArray()) as Tombstone[],

    prune: async (before) => {
      await table().where("deletedAt").below(before).delete();
    },
  };
}
