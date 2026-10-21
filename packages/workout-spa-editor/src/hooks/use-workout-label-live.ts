/**
 * useWorkoutLabelLive — the title, duration and date of one saved workout of
 * the active athlete, for a confirmation that names the workout instead of
 * showing its id.
 *
 * Tri-state on purpose: `undefined` while Dexie is still answering, `null`
 * when no such workout belongs to the active athlete. A card that showed
 * "not found" during the first render would tell the user something false.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { thresholdsForSport } from "../lib/athlete";
import { buildReviewModel } from "../lib/workout-review";
import type { WorkoutRecord } from "../types/calendar-record";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useReviewCopy } from "./use-review-copy";

export type WorkoutLabel = { title: string; duration: string; date: string };

export function useWorkoutLabelLive(
  workoutId: string,
  fallbackTitle: string
): WorkoutLabel | null | undefined {
  const active = useActiveProfileLive();
  const copy = useReviewCopy();
  const record = useLiveQuery(
    async () =>
      (await db.table<WorkoutRecord>("workouts").get(workoutId)) ?? null,
    [workoutId]
  );

  if (record === undefined || active === undefined) return undefined;
  if (record === null || record.profileId !== active.id || !record.krd) {
    return null;
  }

  const model = buildReviewModel(
    record.krd,
    thresholdsForSport(active.profile, record.sport),
    fallbackTitle,
    copy
  );
  if (!model) return null;
  return { title: model.title, duration: model.duration, date: record.date };
}
