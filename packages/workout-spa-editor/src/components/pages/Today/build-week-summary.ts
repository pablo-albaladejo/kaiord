/**
 * Per-day summary for the Daily WeekStrip: presence (count) + a coarse,
 * honest intensity bucket per day across all sources. Measured TSS (workouts
 * with a KRD) is bucketed and flagged `estimated:false`; coaching `effort`
 * (1-5) is bucketed and flagged `estimated:true`; a day with only KRD-less
 * (raw) workouts and no coaching effort is presence-only (`intensity: null`).
 * No continuous/estimated load magnitude is produced.
 */
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import { buildCalendarBuckets } from "../calendar-buckets";
import { groupWorkoutsByDay } from "../calendar-utils";
import { estimatedBucket, measuredBucket } from "./day-intensity";
import type { IntensityBucket } from "./intensity-bucket";

export type { IntensityBucket };

export type DaySummary = {
  count: number;
  intensity: IntensityBucket | null;
  estimated: boolean;
};

export type WeekSummary = Record<string, DaySummary>;

export type BuildWeekSummaryArgs = {
  dayIsos: string[];
  weekWorkouts: WorkoutRecord[] | undefined;
  coachingByDay: Record<string, CoachingActivity[]>;
  matched: MatchedSessionWithMetadata[];
  profile: Profile | null;
};

export function buildWeekSummary({
  dayIsos,
  weekWorkouts,
  coachingByDay,
  matched,
  profile,
}: BuildWeekSummaryArgs): WeekSummary {
  const workoutsByDay = groupWorkoutsByDay(weekWorkouts, dayIsos);
  const { matchedByDay, soloPlansByDay, soloActualsByDay } =
    buildCalendarBuckets({
      days: dayIsos,
      workoutsByDay,
      coachingByDay,
      matched,
    });

  const summary: WeekSummary = {};
  for (const iso of dayIsos) {
    const dayMatched = matchedByDay[iso] ?? [];
    const plans = soloPlansByDay[iso] ?? [];
    const actuals = soloActualsByDay[iso] ?? [];
    const count = dayMatched.length + plans.length + actuals.length;

    const measured = measuredBucket(
      [...dayMatched.map((m) => m.workout), ...actuals],
      profile
    );
    if (measured) {
      summary[iso] = { count, intensity: measured, estimated: false };
      continue;
    }
    const estimated = estimatedBucket([
      ...plans,
      ...dayMatched.map((m) => m.activity),
    ]);
    summary[iso] = {
      count,
      intensity: estimated,
      estimated: estimated !== null,
    };
  }
  return summary;
}
