/**
 * Measured total duration (seconds) for a WeekStrip day: the summed
 * `totalDuration` of the day's KRD-backed workouts. Returns null when no
 * workout yields a computable duration, so a presence-only day keeps the
 * default mark size — no fabricated magnitude (mirrors `today-load`'s rule).
 * Coaching `duration` is a free-text label and is deliberately not parsed.
 */
import { getStructuredWorkout } from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { calculateWorkoutStats } from "../../../utils/workout-stats";

export function measuredDurationSec(workouts: WorkoutRecord[]): number | null {
  let total = 0;
  let counted = false;
  for (const record of workouts) {
    if (!record.krd) continue;
    const workout = getStructuredWorkout(record.krd);
    if (!workout) continue;
    const duration = calculateWorkoutStats(workout).totalDuration;
    if (typeof duration === "number" && duration > 0) {
      total += duration;
      counted = true;
    }
  }
  return counted ? total : null;
}
