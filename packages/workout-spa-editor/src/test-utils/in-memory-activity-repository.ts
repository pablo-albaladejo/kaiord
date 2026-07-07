import type { ActivityRepository } from "../ports/activity-repository";
import type { ActivityRecord } from "../types/activity-record";

/**
 * In-memory ActivityRepository for tests. Dedups by the same natural key as
 * the Dexie adapter: (profileId, sourceBridgeId, externalId).
 */
export const createInMemoryActivityRepository = (
  store: Map<string, ActivityRecord> = new Map()
): ActivityRepository => ({
  upsertByExternalId: async (record: ActivityRecord) => {
    const key = `${record.profileId}:${record.sourceBridgeId}:${record.externalId}`;
    if (store.has(key)) return { created: false };
    store.set(key, record);
    return { created: true };
  },

  getByProfileAndDateRange: async (profileId, start, end) =>
    [...store.values()].filter(
      (a) => a.profileId === profileId && a.date >= start && a.date <= end
    ),
});
