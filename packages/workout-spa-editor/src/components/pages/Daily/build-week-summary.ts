/**
 * Per-day summaries for the Daily WeekStrip across all sources. See
 * `summarizeDay` for the per-day rules (honest intensity + measured duration,
 * no fabricated continuous load).
 */
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import { buildCalendarBuckets } from "../calendar-buckets";
import { groupWorkoutsByDay } from "../calendar-utils";
import type { DaySummary } from "./summarize-day";
import { summarizeDay } from "./summarize-day";

export type { IntensityBucket } from "./intensity-bucket";
export type { DaySummary };

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
    summary[iso] = summarizeDay(
      matchedByDay[iso] ?? [],
      soloPlansByDay[iso] ?? [],
      soloActualsByDay[iso] ?? [],
      profile
    );
  }
  return summary;
}
