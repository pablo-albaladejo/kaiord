/**
 * useWorkoutRecord Hook
 *
 * Loads a workout record from Dexie by ID and hydrates the store. The
 * same live query reads the record's Garmin ledger row, the source of its
 * placement notice, so the editor page keeps one query.
 *
 * The store is hydrated once per id, so later live results (the row this
 * editor itself just saved) never replace the draft. `baselineKrd` is the
 * editor copy as last loaded or saved: the draft is dirty while it differs.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../hooks/garmin-push-fn";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";

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
  const [baselineKrd, setBaselineKrd] = useState<KRD | null>(null);

  /** Hydrates the store with `krd`; the hydrated copy is the new baseline. */
  const reload = useCallback(
    (krd: KRD) => {
      loadWorkout(krd);
      setBaselineKrd(useWorkoutStore.getState().currentWorkout);
    },
    [loadWorkout]
  );

  useEffect(() => {
    if (!record?.krd || !id) return;
    if (loadedRef.current === id) return;
    loadedRef.current = id;
    reload(record.krd);
  }, [record, id, reload]);

  // `live` is `undefined` until the first query result; after that a
  // missing record is a settled "not found", never an endless load.
  return {
    record,
    placementRow: live?.placementRow,
    loading: live === undefined && id !== undefined,
    notFound: live !== undefined && record === undefined,
    baselineKrd,
    setBaselineKrd,
    reload,
  };
}
