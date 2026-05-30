/**
 * Live-query hooks for the Today page's workout data.
 *
 * Both hooks own a single `useLiveQuery` over the `workouts` table and
 * hit the `[profileId+date]` compound index declared in `dexie-schemas.ts`.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../../types/calendar-record";

const fetchWeekWorkouts = async (
  profileId: string | null,
  start: string,
  end: string
): Promise<WorkoutRecord[]> => {
  if (!profileId) return [];
  return db
    .table<WorkoutRecord>("workouts")
    .where("[profileId+date]")
    .between([profileId, start], [profileId, end], true, true)
    .toArray();
};

export function useWeekWorkoutsLive(
  profileId: string | null,
  start: string,
  end: string
): WorkoutRecord[] | undefined {
  return useLiveQuery(
    () => fetchWeekWorkouts(profileId, start, end),
    [profileId, start, end]
  );
}
