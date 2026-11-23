import type { TraceRepository } from "../ports/simple-repositories";
import type { TraceRecord } from "../types/trace-schemas";

export function createInMemoryTraceRepository(
  store: Map<string, TraceRecord> = new Map()
): TraceRepository {
  return {
    put: async (record) => {
      store.set(record.id, record);
    },
    list: async () =>
      [...store.values()].sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt)
      ),
    getById: async (id) => store.get(id),
    deleteMany: async (ids) => {
      for (const id of ids) store.delete(id);
    },
    clear: async () => {
      store.clear();
    },
  };
}
