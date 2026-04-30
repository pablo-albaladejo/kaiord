/**
 * In-Memory Usage Repository
 *
 * Test implementation using a plain Map keyed by yearMonth. Accepts an
 * externally-owned store so `createInMemoryPersistence` can snapshot
 * it for transaction rollback.
 */

import type { UsageRepository } from "../ports/persistence-port";
import type { UsageRecord } from "../types/usage-schemas";

export function createInMemoryUsageRepository(
  store: Map<string, UsageRecord> = new Map()
): UsageRepository {
  return {
    getByMonth: async (yearMonth) => store.get(yearMonth),

    put: async (record) => {
      store.set(record.yearMonth, record);
    },
  };
}
