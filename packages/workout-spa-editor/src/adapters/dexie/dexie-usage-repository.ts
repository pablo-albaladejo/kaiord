/**
 * Dexie Usage Repository
 *
 * IndexedDB-backed implementation of UsageRepository.
 */

import type { UsageRepository } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieUsageRepository(
  db: KaiordDatabase
): UsageRepository {
  const table = () => db.table("usage");

  return {
    getByMonth: async (yearMonth) => {
      const result = await table().get(yearMonth);
      return result ?? undefined;
    },

    put: async (record) => {
      await table().put(record);
    },
  };
}
