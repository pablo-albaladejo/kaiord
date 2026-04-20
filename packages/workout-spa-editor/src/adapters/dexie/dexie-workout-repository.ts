/**
 * Dexie Workout Repository
 *
 * IndexedDB-backed implementation of WorkoutRepository.
 */

import type { WorkoutRepository } from "../../ports/persistence-port";
import { stripIds } from "../../store/strip-ids";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KaiordDatabase } from "./dexie-database";

const stripRecordIds = (record: WorkoutRecord): WorkoutRecord =>
  record.krd ? { ...record, krd: stripIds(record.krd) } : record;

export function createDexieWorkoutRepository(
  db: KaiordDatabase
): WorkoutRepository {
  const table = () => db.table("workouts");

  return {
    getById: async (id) => {
      const result = await table().get(id);
      return result ?? undefined;
    },

    getByDateRange: async (start, end) =>
      table().where("date").between(start, end, true, true).toArray(),

    getByState: async (state) =>
      table()
        .filter((w: Record<string, unknown>) => w.state === state)
        .toArray(),

    getBySourceId: async (source, sourceId) => {
      const result = await table()
        .where("[source+sourceId]")
        .equals([source, sourceId])
        .first();
      return result ?? undefined;
    },

    // stripIds chokepoint: UIWorkout ids never leak into persisted records.
    put: async (workout) => {
      await table().put(stripRecordIds(workout));
    },

    delete: async (id) => {
      await table().delete(id);
    },
  };
}
