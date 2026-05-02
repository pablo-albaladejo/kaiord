/**
 * Three-way bucketing for the calendar week grid: matched sessions,
 * solo plans, solo actuals. Extracted from `CalendarPage` so the page
 * file stays under the per-file lint cap.
 */

import type { MatchedSessionWithMetadata as PageMatchedSession } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";

export type BuildBucketsArgs = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay: Record<string, CoachingActivity[]>;
  matched: PageMatchedSession[];
};

export type CalendarBuckets = {
  matchedByDay: Record<string, PageMatchedSession[]>;
  soloPlansByDay: Record<string, CoachingActivity[]>;
  soloActualsByDay: Record<string, WorkoutRecord[]>;
};

export function buildCalendarBuckets({
  days,
  workoutsByDay,
  coachingByDay,
  matched,
}: BuildBucketsArgs): CalendarBuckets {
  const matchedActivityIds = new Set(matched.map((m) => m.activity.id));
  const matchedWorkoutIds = new Set(matched.map((m) => m.workout.id));
  const matchedByDay: Record<string, PageMatchedSession[]> = {};
  const soloPlansByDay: Record<string, CoachingActivity[]> = {};
  const soloActualsByDay: Record<string, WorkoutRecord[]> = {};
  for (const day of days) {
    matchedByDay[day] = matched.filter((m) => m.match.date === day);
    soloPlansByDay[day] = (coachingByDay[day] ?? []).filter(
      (a) => !matchedActivityIds.has(a.id)
    );
    soloActualsByDay[day] = (workoutsByDay[day] ?? []).filter(
      (w) => !matchedWorkoutIds.has(w.id)
    );
  }
  return { matchedByDay, soloPlansByDay, soloActualsByDay };
}
