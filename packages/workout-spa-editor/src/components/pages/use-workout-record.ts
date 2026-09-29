/**
 * useWorkoutRecord Hook
 *
 * Loads a workout record from Dexie by ID and hydrates the store. The
 * same live query reads the record's Garmin ledger row, the source of its
 * placement notice, so the editor page keeps one query.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../hooks/garmin-push-fn";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";

export function useWorkoutRecord(id: string | undefined) {
  const live = useLiveQuery(
    async () =>
      id
        ? {
            record: await db.table<WorkoutRecord>("workouts").get(id),
            placementRow: await ledgerRepo.findByNaturalKey({
              kaiordRecordId: id,
              destinationBridgeId: GARMIN_BRIDGE_ID,
            }),
          }
        : undefined,
    [id]
  );
  const record = live?.record;

  const loadWorkout = useWorkoutStore((s) => s.loadWorkout);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!record?.krd || !id) return;
    if (loadedRef.current === id) return;
    loadedRef.current = id;
    loadWorkout(record.krd);
  }, [record, id, loadWorkout]);

  return {
    record,
    placementRow: live?.placementRow,
    loading: record === undefined && id !== undefined,
  };
}
