/**
 * Live-query wiring for the Today planned section.
 *
 * Mounts the same coaching + matched sources the calendar composes
 * (`useCoachingActivities`, `useMatchedSessions`), scoped to the visible week,
 * and assembles today's buckets via the pure `buildTodayBuckets`. Note:
 * `useMatchedSessions` is read-with-heal-writeback (it schedules an idempotent
 * Dexie heal); `PersistenceProvider` wraps the app root so it is safe here.
 * Auto-execute matching (`useExecutedMatchAutoForCalendar`) is intentionally
 * NOT mounted — that stays calendar-owned.
 */
import { useMemo } from "react";

import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { useMatchedSessions } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { buildTodayBuckets, type TodayBuckets } from "./build-today-buckets";

export function useTodayPlannedBuckets(
  profileId: string | null,
  dayIsos: string[],
  todayIso: string,
  weekWorkouts: WorkoutRecord[] | undefined
): TodayBuckets {
  const coaching = useCoachingActivities(dayIsos);
  const matched = useMatchedSessions(profileId, dayIsos);

  return useMemo(
    () =>
      buildTodayBuckets({
        dayIsos,
        todayIso,
        weekWorkouts,
        coachingByDay: coaching.byDay,
        matched: matched ?? [],
      }),
    [dayIsos, todayIso, weekWorkouts, coaching.byDay, matched]
  );
}
