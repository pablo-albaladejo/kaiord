/**
 * In-Memory Usage Repository
 *
 * Test implementation using a plain Map keyed by yearMonth.
 */

import type { UsageRepository } from "../ports/persistence-port";
import type { UsageRecord } from "../types/usage-schemas";

export function createInMemoryUsageRepository(): UsageRepository {
  const store = new Map<string, UsageRecord>();

  return {
    getByMonth: async (yearMonth) => store.get(yearMonth),

    put: async (record) => {
      store.set(record.yearMonth, record);
    },
  };
}
