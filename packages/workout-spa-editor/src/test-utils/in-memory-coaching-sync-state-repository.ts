/**
 * In-Memory Coaching Sync State Repository
 *
 * Test implementation keyed by `${source}:${profileId}`. Accepts an
 * externally-owned store so `createInMemoryPersistence` can snapshot it
 * for transaction rollback.
 */

import type { CoachingSyncStateRepository } from "../ports/persistence-port";
import type { CoachingSyncStateRecord } from "../types/coaching-sync-state";

const key = (source: string, profileId: string) => `${source}:${profileId}`;

export function createInMemoryCoachingSyncStateRepository(
  store: Map<string, CoachingSyncStateRecord> = new Map()
): CoachingSyncStateRepository {
  return {
    getBySourceAndProfile: async (source, profileId) =>
      store.get(key(source, profileId)),

    put: async (record) => {
      store.set(key(record.source, record.profileId), record);
    },

    deleteByProfile: async (profileId) => {
      for (const [k, record] of store.entries()) {
        if (record.profileId === profileId) {
          store.delete(k);
        }
      }
    },
  };
}
