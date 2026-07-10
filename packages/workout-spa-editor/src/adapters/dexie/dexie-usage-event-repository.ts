/**
 * Dexie Usage Event Repository
 *
 * IndexedDB-backed implementation of UsageEventRepository. Append-only log;
 * `listByMonth` reads via the `[yearMonth+purpose]` compound index.
 */

import type { UsageEventRepository } from "../../ports/simple-repositories";
import type { UsageEventRecord } from "../../types/usage-event-schemas";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieUsageEventRepository(
  db: KaiordDatabase
): UsageEventRepository {
  const table = () => db.table<UsageEventRecord>("usageEvents");

  return {
    append: async (record) => {
      await table().add(record);
    },

    // Range-scan every purpose within the month over the compound index.
    listByMonth: async (yearMonth) =>
      table()
        .where("[yearMonth+purpose]")
        .between([yearMonth, ""], [yearMonth, "￿"])
        .toArray(),
  };
}
