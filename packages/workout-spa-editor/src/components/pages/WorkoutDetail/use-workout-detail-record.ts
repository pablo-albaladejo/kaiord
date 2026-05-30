import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../../types/calendar-record";

/**
 * Read-only Dexie load of a workout by id. Mirrors the lookup in
 * `useWorkoutRecord` (`db.table("workouts").get(id)`) but does NOT hydrate the
 * editor's Zustand store, since the detail view never mutates the draft.
 */
export function useWorkoutDetailRecord(id: string | undefined) {
  const record = useLiveQuery(
    () => (id ? db.table<WorkoutRecord>("workouts").get(id) : undefined),
    [id]
  );

  return { record, loading: record === undefined && id !== undefined };
}
