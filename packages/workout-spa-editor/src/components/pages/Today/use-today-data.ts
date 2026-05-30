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
import type { Profile } from "../../../types/profile";
import { toIsoDate, type WeekDay, weekDays } from "./today-dates";
import { buildReadinessModel, type ReadinessModel } from "./today-readiness";
import { useWeekWorkoutsLive } from "./use-today-workouts-live";

export type TodayData = {
  profile: Profile | null;
  todayIso: string;
  days: WeekDay[];
  weekWorkouts: WorkoutRecord[] | undefined;
  todayWorkout: WorkoutRecord | undefined;
  readiness: ReadinessModel;
};

export function useTodayData(now: Date): TodayData {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const profile = active?.profile ?? null;

  const days = useMemo(() => weekDays(now), [now]);
  const todayIso = toIsoDate(now);
  const start = days[0].iso;
  const end = days[days.length - 1].iso;

  const weekWorkouts = useWeekWorkoutsLive(profileId, start, end);
  const hrvRecords = useHealthHrvHistoryLive(profileId ?? "", {
    start: todayIso,
    end: todayIso,
  });
  const sleepRecords = useHealthSleepWeekLive(profileId ?? "", {
    start: todayIso,
    end: todayIso,
  });

  const todayWorkout = weekWorkouts?.find((w) => w.date === todayIso);
  const readiness = buildReadinessModel(
    hrvRecords?.at(-1)?.krd,
    sleepRecords?.at(-1)?.krd
  );

  return {
    profile,
    todayIso,
    days,
    weekWorkouts,
    todayWorkout,
    readiness,
  };
}
