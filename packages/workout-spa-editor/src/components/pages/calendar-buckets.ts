import { activityToWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import type { MatchedSessionWithMetadata as PageMatchedSession } from "../../hooks/use-matched-sessions";
import type { CrossWeekMatches } from "../../hooks/use-matched-sessions-cross-week";
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import {
  collectExecutedRefIds,
  collectMatchedWorkoutIds,
} from "./calendar-bucket-ids";

export type BuildBucketsArgs = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay: Record<string, CoachingActivity[]>;
  /** Executed activities (v27) rendered natively; defaults to none. */
  activitiesByDay?: Record<string, ActivityRecord[]>;
  matched: PageMatchedSession[];
} & Partial<CrossWeekMatches>;

/**
 * Unmatched source-only activities (no twin WorkoutRecord), projected for the
 * calendar's solo-actual lane. Twin activities are skipped — their own
 * WorkoutRecord already renders. Matched activities are absorbed by the card.
 */
const soloActivityActuals = (
  activities: ActivityRecord[],
  matchedWorkoutIds: ReadonlySet<string>
): WorkoutRecord[] =>
  activities
    .filter((a) => a.linkedWorkoutId === null && !matchedWorkoutIds.has(a.id))
    .map(activityToWorkoutRecord);

export type CalendarBuckets = {
  matchedByDay: Record<string, PageMatchedSession[]>;
  soloPlansByDay: Record<string, CoachingActivity[]>;
  soloActualsByDay: Record<string, WorkoutRecord[]>;
  /**
   * Renderable ids of the week's executed activities: the twin WorkoutRecord
   * id when there is one, else the activity's own id (the rule in
   * `match-executed-refs`). Lets a match whose `workoutId` is itself the
   * execution be recognised as executed.
   */
  executedRefIds: ReadonlySet<string>;
};

export function buildCalendarBuckets({
  days,
  workoutsByDay,
  coachingByDay,
  activitiesByDay = {},
  matched,
  crossWeekMatchedActivityIds = new Set(),
  crossWeekMatchedWorkoutIds,
}: BuildBucketsArgs): CalendarBuckets {
  // A session matched in another week renders there (design §3.6).
  const matchedActivityIds = new Set([
    ...matched.map((m) => m.activity.id),
    ...crossWeekMatchedActivityIds,
  ]);
  // Suppress both the structured workout AND any executed workouts the
  // match has absorbed — otherwise an executed Garmin/FIT recording
  // would render as solo `WorkoutCard` AND as the executed slot of the
  // matched card (A5: no 2x card duplicate).
  const matchedWorkoutIds = collectMatchedWorkoutIds(
    matched,
    crossWeekMatchedWorkoutIds
  );
  const matchedByDay: Record<string, PageMatchedSession[]> = {};
  const soloPlansByDay: Record<string, CoachingActivity[]> = {};
  const soloActualsByDay: Record<string, WorkoutRecord[]> = {};
  for (const day of days) {
    matchedByDay[day] = matched.filter((m) => m.match.date === day);
    soloPlansByDay[day] = (coachingByDay[day] ?? []).filter(
      (a) => !matchedActivityIds.has(a.id)
    );
    soloActualsByDay[day] = [
      ...(workoutsByDay[day] ?? []).filter((w) => !matchedWorkoutIds.has(w.id)),
      ...soloActivityActuals(activitiesByDay[day] ?? [], matchedWorkoutIds),
    ];
  }
  return {
    matchedByDay,
    soloPlansByDay,
    soloActualsByDay,
    executedRefIds: collectExecutedRefIds(activitiesByDay),
  };
}
