import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../../hooks/garmin-push-fn";
import type { WorkoutRecord } from "../../../types/calendar-record";

/**
 * Read-only Dexie load of a workout by id. Mirrors the lookup in
 * `useWorkoutRecord` (`db.table("workouts").get(id)`) but does NOT hydrate the
 * editor's Zustand store, since the detail view never mutates the draft. The
 * same live query reads the record's Garmin ledger row, the source of its
 * placement notice.
 */
export function useWorkoutDetailRecord(id: string | undefined) {
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

  // `live` is `undefined` until the first query result; after that a
  // missing record is a settled "not found", never an endless load.
  return {
    record,
    placementRow: live?.placementRow,
    loading: live === undefined && id !== undefined,
    notFound: live !== undefined && record === undefined,
  };
}
