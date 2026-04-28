/**
 * In-Memory Coaching Repository
 *
 * Test implementation using a plain Map keyed by composite id. Split into
 * read / write groups so the factory function stays under 40 LOC.
 */

import type { CoachingRepository } from "../ports/persistence-port";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";

type Store = Map<string, CoachingActivityRecord>;

const buildReaders = (
  store: Store
): Pick<
  CoachingRepository,
  "getById" | "getByProfileAndDateRange" | "getByProfileAndSourceId"
> => ({
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
});

const buildWriters = (
  store: Store
): Pick<
  CoachingRepository,
  "upsertMany" | "put" | "delete" | "deleteByProfile"
> => ({
  upsertMany: async (records) => {
    for (const record of records) store.set(record.id, record);
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
      if (record.profileId === profileId) store.delete(id);
    }
  },
});

export function createInMemoryCoachingRepository(): CoachingRepository {
  const store: Store = new Map();
  return { ...buildReaders(store), ...buildWriters(store) };
}
