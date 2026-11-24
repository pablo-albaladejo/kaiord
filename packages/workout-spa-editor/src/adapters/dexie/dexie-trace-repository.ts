import type { TraceRepository } from "../../ports/simple-repositories";
import type { TraceRecord } from "../../types/trace-schemas";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieTraceRepository(
  db: KaiordDatabase
): TraceRepository {
  const table = () => db.table<TraceRecord>("traces");
  return {
    put: async (record) => {
      await table().put(record);
    },
    list: () => table().orderBy("startedAt").reverse().toArray(),
    getById: async (id) => (await table().get(id)) ?? undefined,
    deleteMany: async (ids) => {
      await table().bulkDelete([...ids]);
    },
    clear: async () => {
      await table().clear();
    },
  };
}
