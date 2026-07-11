/**
 * In-Memory Usage Event Repository
 *
 * Test implementation using a plain Map keyed by event id. Accepts an
 * externally-owned store so `createInMemoryPersistence` can snapshot it for
 * transaction rollback. Month reads filter by `yearMonth`; `listOlderThan`
 * filters events whose month sorts strictly before the cutoff.
 */

import type { UsageEventRepository } from "../ports/simple-repositories";
import type { UsageEventRecord } from "../types/usage-event-schemas";

export function createInMemoryUsageEventRepository(
  store: Map<string, UsageEventRecord> = new Map()
): UsageEventRepository {
  const all = () => [...store.values()];

  return {
    append: async (record) => {
      store.set(record.id, record);
    },

    listByMonth: async (yearMonth) =>
      all().filter((e) => e.yearMonth === yearMonth),

    listByMonths: async (yearMonths) => {
      const wanted = new Set(yearMonths);
      return all().filter((e) => wanted.has(e.yearMonth));
    },

    listOlderThan: async (yearMonth) =>
      all().filter((e) => e.yearMonth < yearMonth),

    getById: async (id) => store.get(id),

    delete: async (id) => {
      store.delete(id);
    },
  };
}
