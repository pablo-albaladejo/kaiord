/**
 * In-Memory Coaching Day-Notes Repository
 *
 * Test twin of the Dexie adapter, backed by a plain Map keyed by the
 * composite id. Accepts an externally-owned store so
 * `createInMemoryPersistence` can snapshot it for transaction rollback.
 */

import type { CoachingDayNotesRepository } from "../ports/persistence-port";
import {
  buildCoachingDayNotesId,
  type CoachingDayNotesRecord,
} from "../types/coaching-day-notes-record";

type Store = Map<string, CoachingDayNotesRecord>;

export function createInMemoryCoachingDayNotesRepository(
  store: Store = new Map()
): CoachingDayNotesRepository {
  return {
    getByDate: async (profileId, source, date) =>
      store.get(buildCoachingDayNotesId(profileId, source, date)),
    upsert: async (record) => {
      store.set(record.id, record);
    },
    deleteByProfile: async (profileId) => {
      for (const [id, record] of store.entries()) {
        if (record.profileId === profileId) store.delete(id);
      }
    },
  };
}
