/**
 * Live-query helpers for the calendar page state hook.
 *
 * Split out of `use-calendar-state.ts` so that file's main hook
 * stays inside the function/file size budget. Each function below
 * owns exactly one `useLiveQuery` (per the page-level rule).
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../types/calendar-record";

const fetchLatestWorkout = async (
  profileId: string | null
): Promise<WorkoutRecord | undefined> => {
  if (!profileId) return undefined;
  const rows = await db
    .table<WorkoutRecord>("workouts")
    .where("profileId")
    .equals(profileId)
    .sortBy("date");
  return rows.at(-1);
};

export function useLatestWorkoutLive(
  profileId: string | null
): WorkoutRecord | undefined {
  return useLiveQuery(() => fetchLatestWorkout(profileId), [profileId]);
}

export function useAiProviderCountLive(): number {
  return useLiveQuery(() => db.table("aiProviders").count(), []) ?? 0;
}
