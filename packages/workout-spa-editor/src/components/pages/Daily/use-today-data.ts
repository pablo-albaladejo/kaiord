/**
 * Aggregates every reactive source the Today page renders: the active
 * profile, this week's workouts, and today's Garmin health metrics (HRV,
 * sleep, stress). View-model derivation stays in the pure `today-*` helpers.
 */
import type { HrvSummary, SleepRecord } from "@kaiord/core";
import { useMemo } from "react";

import { useEffectiveHealthRecordLive } from "../../../hooks/health/use-effective-health-record-live";
import { useHealthStressDayLive } from "../../../hooks/health/use-health-stress-day-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import type { TodayBuckets } from "./build-today-buckets";
import type { WeekSummary } from "./build-week-summary";
import { pickEffectiveHealthRecord } from "./pick-effective-health-record";
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
  const start = days[0]!.iso;
  const end = days[days.length - 1]!.iso;

  const weekWorkouts = useWeekWorkoutsLive(profileId, start, end);
  // F3.2/F3.3: HRV/sleep resolve through the multi-source resolver
  // instead of reading the table directly — same single-day scope as
  // before, but the "winning" record is now a governed choice (union
  // default today; priority + fallback once F3.1's companion table
  // exists), not just the query's last row.
  const hrvResult = useEffectiveHealthRecordLive<HrvSummary>(
    profileId ?? "",
    "hrv",
    focusIso
  );
  const sleepResult = useEffectiveHealthRecordLive<SleepRecord>(
    profileId ?? "",
    "sleep",
    focusIso
  );
  const stressRecords = useHealthStressDayLive(profileId ?? "", focusIso);
  const hrvPick = pickEffectiveHealthRecord(hrvResult);
  const sleepPick = pickEffectiveHealthRecord(sleepResult);

  const { planned, weekSummary, coachingByDay, expandActivity } =
    useTodayPlannedBuckets(profileId, dayIsos, focusIso, weekWorkouts, profile);
  const isFocusToday = focusIso === realTodayIso;
  // hrvPick/sleepPick already carry {sourceBridgeId, usedFallback} (plus
  // `record`, structurally ignored here) — passed straight through as the
  // source-meta args, no need to reshape into ReadinessMetricSource.
  const readiness = buildReadinessModel(
    hrvPick.record,
    sleepPick.record,
    stressRecords?.map((record) => record.krd),
    isFocusToday,
    hrvPick,
    sleepPick
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
