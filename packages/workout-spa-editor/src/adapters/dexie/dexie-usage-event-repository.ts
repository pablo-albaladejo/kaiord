/**
 * Dexie Usage Event Repository
 *
 * IndexedDB-backed implementation of UsageEventRepository. Append-only log;
 * month reads range-scan the `[yearMonth+purpose]` compound index. `delete(id)`
 * removes a single event by uuid (the tombstone decorator wraps it so a pruned
 * event's removal propagates cross-device).
 */

import type { UsageEventRepository } from "../../ports/simple-repositories";
import type { UsageEventRecord } from "../../types/usage-event-schemas";
import type { KaiordDatabase } from "./dexie-database";

// Upper bound for a `[yearMonth+*]` range: sorts after any real purpose string.
const HIGH = "￿";

export function createDexieUsageEventRepository(
  db: KaiordDatabase
): UsageEventRepository {
  const table = () => db.table<UsageEventRecord>("usageEvents");
  const monthRows = (yearMonth: string) =>
    table()
      .where("[yearMonth+purpose]")
      .between([yearMonth, ""], [yearMonth, HIGH])
      .toArray();

  return {
    append: async (record) => {
      await table().add(record);
    },

    // Range-scan every purpose within the month over the compound index.
    listByMonth: monthRows,

    listByMonths: async (yearMonths) => {
      const perMonth = await Promise.all(yearMonths.map(monthRows));
      return perMonth.flat();
    },

    // Events whose month sorts strictly before the cutoff (retention prune).
    listOlderThan: async (yearMonth) =>
      table().where("[yearMonth+purpose]").below([yearMonth, ""]).toArray(),

    getById: async (id) => (await table().get(id)) ?? undefined,

    delete: async (id) => {
      await table().delete(id);
    },
  };
}
