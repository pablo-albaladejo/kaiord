/**
 * In-memory health-record repository (generic)
 *
 * Mirrors the Dexie implementation's surface for unit tests that
 * don't need IndexedDB. The store is externally owned so
 * `createInMemoryPersistence` can snapshot/restore it inside the
 * transaction wrapper.
 */
import type {
  HealthRecord,
  HealthRecordRepository,
} from "../ports/health-record-repository";

export function createInMemoryHealthRecordRepository<
  T extends HealthRecord<unknown>,
>(store: Map<string, T> = new Map()): HealthRecordRepository<T> {
  return {
    getById: async (id) => store.get(id),
    getByProfileAndDateRange: async (profileId, start, end) =>
      [...store.values()].filter(
        (r) => r.profileId === profileId && r.date >= start && r.date <= end
      ),
    put: async (record) => {
      store.set(record.id, record);
    },
    upsertMany: async (records) => {
      for (const r of records) store.set(r.id, r);
    },
    delete: async (id) => {
      store.delete(id);
    },
    deleteByProfile: async (profileId) => {
      for (const [k, v] of store) {
        if (v.profileId === profileId) store.delete(k);
      }
    },
  };
}
