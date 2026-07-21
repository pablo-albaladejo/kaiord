/**
 * Fetches one WHOOP `cycles/details` window and imports every workout it
 * carries into the `activities` store, resolving each `sport_id` through the
 * pre-fetched sports catalog. Split out of sync-whoop-activities.use-case.ts
 * to keep that file under the per-file line cap.
 */
import {
  type WhoopCycleRecord,
  whoopCyclesResponseSchema,
  workoutToActivity,
} from "@kaiord/whoop";

import type { ActivityRepository } from "../../ports/activity-repository";
import { mapWhoopActivity } from "../import/map-whoop-activity";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const UNKNOWN_SPORT_NAME = "Activity";

export type WhoopImportCounts = { imported: number; skipped: number };
export type WhoopCyclesWindowOutcome =
  { ok: true; counts: WhoopImportCounts } | { ok: false; error?: string };

const importWorkouts = async (
  activities: ActivityRepository,
  profileId: string,
  catalog: Map<number, string>,
  record: WhoopCycleRecord
): Promise<WhoopImportCounts> => {
  const counts: WhoopImportCounts = { imported: 0, skipped: 0 };
  for (const workout of record.workouts ?? []) {
    const sportName = catalog.get(workout.sport_id ?? -1) ?? UNKNOWN_SPORT_NAME;
    const activity = workoutToActivity(workout, sportName);
    const mapped = activity ? mapWhoopActivity(activity, profileId) : null;
    if (!mapped) {
      counts.skipped += 1;
      continue;
    }
    const { created } = await activities.upsertByExternalId(mapped);
    if (created) counts.imported += 1;
    else counts.skipped += 1;
  }
  return counts;
};

export const importWhoopCycleWorkouts = async (
  activities: ActivityRepository,
  profileId: string,
  fetchCycles: (path: string) => Promise<WhoopFetchResult>,
  path: string,
  catalog: Map<number, string>
): Promise<WhoopCyclesWindowOutcome> => {
  let result: WhoopFetchResult;
  try {
    result = await fetchCycles(path);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!result.ok) return { ok: false, error: result.error };
  const parsed = whoopCyclesResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { ok: false, error: "Malformed WHOOP cycles response" };
  }

  const counts: WhoopImportCounts = { imported: 0, skipped: 0 };
  for (const record of parsed.data) {
    const page = await importWorkouts(activities, profileId, catalog, record);
    counts.imported += page.imported;
    counts.skipped += page.skipped;
  }
  return { ok: true, counts };
};
