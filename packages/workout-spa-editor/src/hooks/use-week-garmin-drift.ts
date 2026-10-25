import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import {
  type GarminDateDrift,
  garminDateDrift,
} from "../application/garmin-placement/garmin-date-drift";
import type { WorkoutRecord } from "../types/calendar-record";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "./garmin-push-fn";

export type GarminDriftSubject = {
  workout: Pick<WorkoutRecord, "id" | "date">;
  locked: boolean;
};

export type GarminDriftMap = ReadonlyMap<string, GarminDateDrift>;

/**
 * The visible week's Garmin date drift, keyed by workout id (design §3.11).
 * One live query of the week's ledger rows, separate from the week's own
 * read, so the cards paint first and the badges follow. A locked session is
 * never read: it cannot drift.
 */
export function useWeekGarminDrift(
  subjects: GarminDriftSubject[]
): GarminDriftMap {
  const ids = subjects.filter((s) => !s.locked).map((s) => s.workout.id);
  const idsKey = ids.join(",");
  const rows = useLiveQuery(
    () =>
      ids.length === 0
        ? Promise.resolve([])
        : ledgerRepo.listByRecordIds({
            kaiordRecordIds: ids,
            destinationBridgeId: GARMIN_BRIDGE_ID,
          }),
    [idsKey]
  );
  return useMemo(() => {
    const byId = new Map((rows ?? []).map((r) => [r.kaiordRecordId, r]));
    const drift = new Map<string, GarminDateDrift>();
    for (const { workout, locked } of subjects) {
      const value = garminDateDrift(byId.get(workout.id), workout, { locked });
      if (value) drift.set(workout.id, value);
    }
    return drift;
  }, [rows, subjects]);
}
