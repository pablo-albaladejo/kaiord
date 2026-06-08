/**
 * Pure assembly of the Today planned-section buckets.
 *
 * Mirrors the calendar's day cell: the SAME week-scoped sources are fed
 * through `buildCalendarBuckets` (so the matched/solo dedup is identical to
 * the calendar's) and today's slice is read out. Keeping this pure and
 * week-scoped makes Today's output a literal subset of the calendar's, so the
 * two surfaces cannot silently diverge (incl. cross-day matches).
 */
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { buildCalendarBuckets } from "../calendar-buckets";
import { groupWorkoutsByDay } from "../calendar-utils";

export type TodayBuckets = {
  matchedSessions: MatchedSessionWithMetadata[];
  soloPlans: CoachingActivity[];
  soloActuals: WorkoutRecord[];
};

export type BuildTodayBucketsArgs = {
  dayIsos: string[];
  todayIso: string;
  weekWorkouts: WorkoutRecord[] | undefined;
  coachingByDay: Record<string, CoachingActivity[]>;
  matched: MatchedSessionWithMetadata[];
};

export function buildTodayBuckets({
  dayIsos,
  todayIso,
  weekWorkouts,
  coachingByDay,
  matched,
}: BuildTodayBucketsArgs): TodayBuckets {
  const workoutsByDay = groupWorkoutsByDay(weekWorkouts, dayIsos);
  const { matchedByDay, soloPlansByDay, soloActualsByDay } =
    buildCalendarBuckets({
      days: dayIsos,
      workoutsByDay,
      coachingByDay,
      matched,
    });
  return {
    matchedSessions: matchedByDay[todayIso] ?? [],
    soloPlans: soloPlansByDay[todayIso] ?? [],
    soloActuals: soloActualsByDay[todayIso] ?? [],
  };
}

/** True only when every source bucket for today is empty (the deduped output,
    not the raw queries — a coaching activity absorbed into a match is not
    empty). */
export function todayBucketsEmpty(buckets: TodayBuckets): boolean {
  return (
    buckets.matchedSessions.length === 0 &&
    buckets.soloPlans.length === 0 &&
    buckets.soloActuals.length === 0
  );
}
