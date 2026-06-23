/**
 * Live-query wiring for the Daily planned section + WeekStrip summary.
 *
 * Mounts the same coaching + matched sources the calendar composes
 * (`useCoachingActivities`, `useMatchedSessions`), scoped to the visible week.
 * Returns the focused day's buckets, the per-day week summary (presence +
 * intensity), and the coaching `byDay` map + `expandActivity` callback so the
 * Daily page can open a coaching activity in place. Note: `useMatchedSessions`
 * is read-with-heal-writeback (idempotent); `useExecutedMatchAutoForCalendar`
 * is intentionally NOT mounted — that stays calendar-owned.
 */
import { useMemo } from "react";

import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { useMatchedSessions } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import { buildTodayBuckets, type TodayBuckets } from "./build-today-buckets";
import { buildWeekSummary, type WeekSummary } from "./build-week-summary";

export type TodayPlanned = {
  planned: TodayBuckets;
  weekSummary: WeekSummary;
  coachingByDay: Record<string, CoachingActivity[]>;
  expandActivity: (activity: CoachingActivity) => void;
};

export function useTodayPlannedBuckets(
  profileId: string | null,
  dayIsos: string[],
  focusIso: string,
  weekWorkouts: WorkoutRecord[] | undefined,
  profile: Profile | null
): TodayPlanned {
  const coaching = useCoachingActivities(dayIsos);
  const matched = useMatchedSessions(profileId, dayIsos);

  const planned = useMemo(
    () =>
      buildTodayBuckets({
        dayIsos,
        focusIso,
        weekWorkouts,
        coachingByDay: coaching.byDay,
        matched: matched ?? [],
      }),
    [dayIsos, focusIso, weekWorkouts, coaching.byDay, matched]
  );

  const weekSummary = useMemo(
    () =>
      buildWeekSummary({
        dayIsos,
        weekWorkouts,
        coachingByDay: coaching.byDay,
        matched: matched ?? [],
        profile,
      }),
    [dayIsos, weekWorkouts, coaching.byDay, matched, profile]
  );

  return {
    planned,
    weekSummary,
    coachingByDay: coaching.byDay,
    expandActivity: coaching.expandActivity,
  };
}
