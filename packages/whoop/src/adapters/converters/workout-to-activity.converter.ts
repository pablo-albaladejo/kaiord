import type { Activity } from "@kaiord/core";

import type { WhoopWorkout } from "../schemas/whoop-workout.schema";

const SOURCE = "whoop";
const KILOJOULES_PER_KCAL = 4.184;
const MS_PER_S = 1000;
const ISO_DATE_LENGTH = 10;
const DURING_RANGE = /'([^']+)'\s*,\s*'([^']+)'/;

/**
 * Parses a Postgres-range `during` string such as
 * `"['2026-07-10T08:15:00.000Z','2026-07-10T09:05:30.000Z')"` into its two
 * ISO endpoints, or `null` when the string doesn't match the expected shape.
 */
const parseDuringRange = (
  during: string
): { start: string; end: string } | null => {
  const match = DURING_RANGE.exec(during);
  const start = match?.[1];
  const end = match?.[2];
  return start === undefined || end === undefined ? null : { start, end };
};

/**
 * Maps a WHOOP cycle `workouts[]` entry to a KRD `Activity`. WHOOP
 * identifies the sport by a numeric `sport_id`; this converter stays pure
 * and does not fetch the sports catalog itself — the caller resolves
 * `sport_id` via `buildSportCatalog` and passes the resolved name in
 * (falling back to `"Activity"` for `-1`/an unknown id). Energy is converted
 * from WHOOP's kilojoules to KRD's kcal (`kilojoules / 4.184`, rounded).
 * Workouts without a stable `activity_id` or a parseable `during` window
 * can't be deduplicated or dated, so those yield `null`.
 */
export const workoutToActivity = (
  workout: WhoopWorkout,
  sportName: string
): Activity | null => {
  if (workout.activity_id == null || workout.during == null) {
    return null;
  }

  const range = parseDuringRange(workout.during);
  if (range === null) {
    return null;
  }

  const { start, end } = range;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  const durationSeconds =
    Number.isNaN(startMs) || Number.isNaN(endMs)
      ? undefined
      : Math.round((endMs - startMs) / MS_PER_S);

  return {
    kind: "activity",
    summary: {
      date: start.slice(0, ISO_DATE_LENGTH),
      start_time: start,
      sport: sportName,
      ...(durationSeconds != null ? { duration_seconds: durationSeconds } : {}),
      ...(workout.average_heart_rate != null
        ? { avg_heart_rate: workout.average_heart_rate }
        : {}),
      ...(workout.kilojoules != null
        ? {
            total_calories: Math.round(
              workout.kilojoules / KILOJOULES_PER_KCAL
            ),
          }
        : {}),
      source: SOURCE,
      source_id: workout.activity_id,
    },
  };
};
