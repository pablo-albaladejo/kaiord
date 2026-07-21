import type { Activity } from "@kaiord/core";

import type { WhoopWorkout } from "../schemas/whoop-workout.schema";

const SOURCE = "whoop";
const KILOJOULES_PER_KCAL = 4.184;
const MS_PER_S = 1000;
const ISO_DATE_LENGTH = 10;
const MAX_BPM = 300;
const MIN_BPM = 0;
const DURING_RANGE = /'([^']+)'\s*,\s*'([^']+)'/;
const OFFSET = /^([+-])(\d{2}):(\d{2})$/;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

/**
 * Parses a Postgres-range `during` string such as
 * `"['2026-07-10T08:15:00.000Z','2026-07-10T09:05:30.000Z')"` into its two
 * epoch-millisecond endpoints, or `null` when the string doesn't match the
 * expected shape, either endpoint isn't a valid date, or the window is
 * inverted (end before start). Real WHOOP data is always well-formed ISO;
 * the guards keep a malformed `during` from producing an activity the KRD
 * `activitySchema` would reject (e.g. an unparseable `date`).
 */
const parseDuringMs = (
  during: string
): { startMs: number; end: string } | null => {
  const match = DURING_RANGE.exec(during);
  const start = match?.[1];
  const end = match?.[2];
  if (start === undefined || end === undefined) return null;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return null;
  }
  return { startMs, end };
};

/**
 * The WHOOP-local calendar date for a UTC start instant, applying the
 * workout's own `timezone_offset` (e.g. `"+02:00"`). WHOOP's `during`
 * endpoints are UTC (`…Z`), so slicing the date off the raw UTC start would
 * bucket an evening workout that crosses UTC midnight onto the wrong calendar
 * day for non-UTC users — and disagree with the strain converter, which dates
 * from WHOOP's local `cycle.days`. When the offset is absent/unparseable the
 * UTC date is used.
 */
const localCalendarDate = (
  startMs: number,
  offset: string | null | undefined
): string => {
  const m = offset != null ? OFFSET.exec(offset) : null;
  const offsetMs = m
    ? (m[1] === "-" ? -1 : 1) *
      (Number(m[2]) * MINUTES_PER_HOUR + Number(m[3])) *
      MS_PER_MINUTE
    : 0;
  return new Date(startMs + offsetMs).toISOString().slice(0, ISO_DATE_LENGTH);
};

const clampBpm = (bpm: number): number =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

/**
 * Maps a WHOOP cycle `workouts[]` entry to a KRD `Activity`. WHOOP identifies
 * the sport by a numeric `sport_id`; this converter stays pure and does not
 * fetch the sports catalog itself — the caller resolves `sport_id` via
 * `buildSportCatalog` and passes the resolved name in (falling back to
 * `"Activity"` for `-1`/an unknown id). Energy is converted from WHOOP's
 * kilojoules to KRD's kcal (`kilojoules / 4.184`, rounded); heart rate is
 * rounded and clamped to 0–300; both are dropped when absent or (for energy)
 * negative, so the output always satisfies `activitySchema`. Workouts without
 * a stable `activity_id` or a valid `during` window can't be deduplicated or
 * dated, so those yield `null`.
 */
export const workoutToActivity = (
  workout: WhoopWorkout,
  sportName: string
): Activity | null => {
  if (workout.activity_id == null || workout.during == null) {
    return null;
  }

  const range = parseDuringMs(workout.during);
  if (range === null) {
    return null;
  }

  const { startMs, end } = range;
  const start = new Date(startMs).toISOString();
  const durationSeconds = Math.round((Date.parse(end) - startMs) / MS_PER_S);
  const { average_heart_rate: avgHr, kilojoules } = workout;

  return {
    kind: "activity",
    summary: {
      date: localCalendarDate(startMs, workout.timezone_offset),
      start_time: start,
      sport: sportName,
      duration_seconds: durationSeconds,
      ...(avgHr != null ? { avg_heart_rate: clampBpm(avgHr) } : {}),
      ...(kilojoules != null && kilojoules >= 0
        ? { total_calories: Math.round(kilojoules / KILOJOULES_PER_KCAL) }
        : {}),
      source: SOURCE,
      source_id: workout.activity_id,
    },
  };
};
