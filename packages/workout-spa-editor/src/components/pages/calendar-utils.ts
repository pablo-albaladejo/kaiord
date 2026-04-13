/**
 * Calendar page utilities - workout grouping by day.
 */

import type { WorkoutRecord } from "../../types/calendar-record";

export function groupWorkoutsByDay(
  workouts: WorkoutRecord[] | undefined,
  days: string[]
): Record<string, WorkoutRecord[]> {
  const map: Record<string, WorkoutRecord[]> = {};
  for (const day of days) {
    map[day] = [];
  }
  if (!workouts) return map;

  for (const w of workouts) {
    if (map[w.date]) {
      map[w.date].push(w);
    }
  }
  for (const day of days) {
    map[day].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return map;
}

export function countRawWorkouts(
  workouts: WorkoutRecord[] | undefined
): number {
  return (workouts ?? []).filter((w) => w.state === "raw").length;
}
