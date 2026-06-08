/**
 * Aggregates every reactive source the Today page renders: the active
 * profile, this week's workouts, and today's Garmin health metrics (HRV +
 * sleep). View-model derivation stays in the pure `today-*` helpers.
 */
import { useMemo } from "react";

import { useHealthHrvHistoryLive } from "../../../hooks/health/use-health-hrv-history-live";
import { useHealthSleepWeekLive } from "../../../hooks/health/use-health-sleep-week-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import type { TodayBuckets } from "./build-today-buckets";
import type { WeekSummary } from "./build-week-summary";
import { toIsoDate, type WeekDay, weekDays } from "./today-dates";
import { buildReadinessModel, type ReadinessModel } from "./today-readiness";
import { useTodayPlannedBuckets } from "./use-today-planned-buckets";
import { useWeekWorkoutsLive } from "./use-today-workouts-live";

export type TodayData = {
  profile: Profile | null;
  focusIso: string;
  realTodayIso: string;
  isFocusToday: boolean;
  days: WeekDay[];
  weekWorkouts: WorkoutRecord[] | undefined;
  planned: TodayBuckets;
  weekSummary: WeekSummary;
  coachingByDay: Record<string, CoachingActivity[]>;
  expandActivity: (activity: CoachingActivity) => void;
  readiness: ReadinessModel;
};

export function useTodayData(focusDate: Date, realTodayIso: string): TodayData {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const profile = active?.profile ?? null;

  const days = useMemo(
    () => weekDays(focusDate, realTodayIso),
    [focusDate, realTodayIso]
  );
  const dayIsos = useMemo(() => days.map((d) => d.iso), [days]);
  const focusIso = toIsoDate(focusDate);
  const start = days[0].iso;
  const end = days[days.length - 1].iso;

  const weekWorkouts = useWeekWorkoutsLive(profileId, start, end);
  const hrvRecords = useHealthHrvHistoryLive(profileId ?? "", {
    start: focusIso,
    end: focusIso,
  });
  const sleepRecords = useHealthSleepWeekLive(profileId ?? "", {
    start: focusIso,
    end: focusIso,
  });

  const { planned, weekSummary, coachingByDay, expandActivity } =
    useTodayPlannedBuckets(profileId, dayIsos, focusIso, weekWorkouts, profile);
  const isFocusToday = focusIso === realTodayIso;
  const readiness = buildReadinessModel(
    hrvRecords?.at(-1)?.krd,
    sleepRecords?.at(-1)?.krd,
    isFocusToday
  );

  return {
    profile,
    focusIso,
    realTodayIso,
    isFocusToday,
    days,
    weekWorkouts,
    planned,
    weekSummary,
    coachingByDay,
    expandActivity,
    readiness,
  };
}
