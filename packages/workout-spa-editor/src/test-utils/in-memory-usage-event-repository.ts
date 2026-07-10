/**
 * In-Memory Usage Event Repository
 *
 * Test implementation using a plain Map keyed by event id. Accepts an
 * externally-owned store so `createInMemoryPersistence` can snapshot it for
 * transaction rollback. `listByMonth` filters the log by yearMonth.
 */

import type { UsageEventRepository } from "../ports/simple-repositories";
import type { UsageEventRecord } from "../types/usage-event-schemas";

export function createInMemoryUsageEventRepository(
  store: Map<string, UsageEventRecord> = new Map()
): UsageEventRepository {
  return {
    append: async (record) => {
      store.set(record.id, record);
    },

    listByMonth: async (yearMonth) =>
      [...store.values()].filter((e) => e.yearMonth === yearMonth),
  };
}
