/**
 * In-Memory Workout Repository
 *
 * Test implementation using a plain Map. Accepts an externally-owned
 * store so `createInMemoryPersistence` can snapshot it for transaction
 * rollback.
 */

import type { WorkoutRecord } from "../types/calendar-schemas";
import type { WorkoutRepository } from "../ports/persistence-port";

export function createInMemoryWorkoutRepository(
  store: Map<string, WorkoutRecord> = new Map()
): WorkoutRepository {
  return {
    getById: async (id) => store.get(id),

    getByDateRange: async (start, end) =>
      [...store.values()].filter((w) => w.date >= start && w.date <= end),

    getByState: async (state) =>
      [...store.values()].filter((w) => w.state === state),

    getBySourceId: async (source, sourceId) =>
      [...store.values()].find(
        (w) => w.source === source && w.sourceId === sourceId
      ),

    put: async (workout) => {
      store.set(workout.id, workout);
    },

    delete: async (id) => {
      store.delete(id);
    },
  };
}
