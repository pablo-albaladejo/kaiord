/**
 * `buildWeeklyTrainingTime` — buckets a profile's structured workouts into
 * Monday-anchored weeks and sums each week's total classifiable training time
 * (the time-step seconds across its workouts), in minutes.
 *
 * This is the "weekly time-in-zone" trend signal the Nutrition chart overlays:
 * a single dated point per week (anchored to the week's Monday) rather than a
 * per-day jitter. Workouts with no time-based steps contribute zero.
 */

import type { Workout } from "@kaiord/core";

import { getStructuredWorkout } from "../../lib/workout-review";
import { flattenTimeSteps } from "../../lib/workout-review/flatten-steps";
import type { WorkoutRecord } from "../../types/calendar-record";
import { weekDatesFrom } from "./week-dates";

const SECONDS_PER_MINUTE = 60;

/** One weekly aggregate: the Monday ISO date and total training minutes. */
export type WeeklyTrainingTimePoint = { date: string; minutes: number };

const workoutSeconds = (workout: Workout): number =>
  flattenTimeSteps(workout).reduce(
    (total, { seconds }) => total + (seconds ?? 0),
    0
  );

const accumulateByWeek = (records: WorkoutRecord[]): Map<string, number> => {
  const byWeek = new Map<string, number>();
  for (const record of records) {
    if (!record.krd) continue;
    const workout = getStructuredWorkout(record.krd);
    if (!workout) continue;
    const monday = weekDatesFrom(record.date)[0]!;
    byWeek.set(monday, (byWeek.get(monday) ?? 0) + workoutSeconds(workout));
  }
  return byWeek;
};

export const buildWeeklyTrainingTime = (
  records: WorkoutRecord[]
): WeeklyTrainingTimePoint[] =>
  [...accumulateByWeek(records).entries()]
    .map(([date, seconds]) => ({
      date,
      minutes: seconds / SECONDS_PER_MINUTE,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
