/**
 * Dexie Health-Record Repository (generic)
 *
 * Single factory shared by all six v16 health stores. Each per-metric
 * repository is one line — see `dexie-persistence-adapter.ts` for the
 * named instantiations. The `[profileId+date]` compound index serves
 * the date-range query the future health-hub hooks need.
 */
import type {
  HealthRecord,
  HealthRecordRepository,
} from "../../ports/health-record-repository";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieHealthRecordRepository<
  T extends HealthRecord<unknown>,
>(db: KaiordDatabase, tableName: string): HealthRecordRepository<T> {
  const table = () => db.table<T>(tableName);
  return {
    getById: async (id) => (await table().get(id)) ?? undefined,
    getByProfileAndDateRange: async (profileId, start, end) =>
      table()
        .where("[profileId+date]")
        .between([profileId, start], [profileId, end], true, true)
        .toArray(),
    put: async (record) => {
      await table().put(record);
    },
    upsertMany: async (records) => {
      await table().bulkPut([...records]);
    },
    delete: async (id) => {
      await table().delete(id);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
