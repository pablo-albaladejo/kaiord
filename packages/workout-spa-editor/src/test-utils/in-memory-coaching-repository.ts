/**
 * In-Memory Coaching Repository
 *
 * Test implementation using a plain Map keyed by composite id.
 */

import type { CoachingRepository } from "../ports/persistence-port";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";

export function createInMemoryCoachingRepository(): CoachingRepository {
  const store = new Map<string, CoachingActivityRecord>();

  return {
    getById: async (id) => store.get(id),

    getByProfileAndDateRange: async (profileId, start, end) =>
      [...store.values()].filter(
        (r) => r.profileId === profileId && r.date >= start && r.date <= end
      ),

    getByProfileAndSourceId: async (profileId, source, sourceId) =>
      [...store.values()].find(
        (r) =>
          r.profileId === profileId &&
          r.source === source &&
          r.sourceId === sourceId
      ),

    upsertMany: async (records) => {
      for (const record of records) {
        store.set(record.id, record);
      }
    },

    put: async (record) => {
      store.set(record.id, record);
    },

    // No-op when missing — matches Dexie's behavior.
    delete: async (id) => {
      store.delete(id);
    },

    deleteByProfile: async (profileId) => {
      for (const [id, record] of store.entries()) {
        if (record.profileId === profileId) {
          store.delete(id);
        }
      }
    },
  };
}
