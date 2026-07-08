/**
 * Aggregates every reactive source the Today page renders: the active
 * profile, this week's workouts, and today's readiness. View-model
 * derivation stays in the pure `today-*` helpers; readiness resolution
 * lives in `use-today-readiness`.
 */
import { useMemo } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import type { TodayBuckets } from "./build-today-buckets";
import type { WeekSummary } from "./build-week-summary";
import { toIsoDate, type WeekDay, weekDays } from "./today-dates";
import type { ReadinessModel } from "./today-readiness";
import { useTodayPlannedBuckets } from "./use-today-planned-buckets";
import { useTodayReadiness } from "./use-today-readiness";
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
  const isFocusToday = focusIso === realTodayIso;
  const start = days[0]!.iso;
  const end = days[days.length - 1]!.iso;

  const weekWorkouts = useWeekWorkoutsLive(profileId, start, end);
  const readiness = useTodayReadiness(profileId, focusIso, isFocusToday);

  const { planned, weekSummary, coachingByDay, expandActivity } =
    useTodayPlannedBuckets(profileId, dayIsos, focusIso, weekWorkouts, profile);

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
