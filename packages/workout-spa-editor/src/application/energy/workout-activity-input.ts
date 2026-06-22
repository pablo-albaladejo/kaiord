/**
 * Bridges a planned `WorkoutRecord` into the core `ExpectedActivityKcalInput`.
 *
 * Returns `null` when the record carries no structured workout or no positive
 * computable duration — those days contribute nothing to the day's estimate.
 * Distance (meters → km) is forwarded so the core running-distance tier can
 * apply; power is intentionally omitted (see `estimate-day-activity-kcal`).
 */

import type { ExpectedActivityKcalInput } from "@kaiord/core";

import { getStructuredWorkout } from "../../lib/workout-review";
import type { WorkoutRecord } from "../../types/calendar-record";
import { calculateWorkoutStats } from "../../utils/workout-stats";

const METERS_PER_KILOMETER = 1000;

export const toWorkoutActivityInput = (
  record: WorkoutRecord,
  weightKg: number
): ExpectedActivityKcalInput | null => {
  if (!record.krd) return null;
  const workout = getStructuredWorkout(record.krd);
  if (!workout) return null;
  const stats = calculateWorkoutStats(workout);
  const durationSec = stats.totalDuration;
  if (durationSec === null || durationSec <= 0) return null;
  const distanceKm =
    stats.totalDistance !== null && stats.totalDistance > 0
      ? stats.totalDistance / METERS_PER_KILOMETER
      : undefined;
  return { sport: workout.sport, durationSec, weightKg, distanceKm };
};
