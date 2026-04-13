/**
 * useWorkoutRecord Hook
 *
 * Loads a workout record from Dexie by ID and hydrates the store.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";

export function useWorkoutRecord(id: string | undefined) {
  const record = useLiveQuery(
    () => (id ? db.table<WorkoutRecord>("workouts").get(id) : undefined),
    [id]
  );

  const loadWorkout = useWorkoutStore((s) => s.loadWorkout);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!record?.krd || !id) return;
    if (loadedRef.current === id) return;
    loadedRef.current = id;
    loadWorkout(record.krd);
  }, [record, id, loadWorkout]);

  return { record, loading: record === undefined && id !== undefined };
}
