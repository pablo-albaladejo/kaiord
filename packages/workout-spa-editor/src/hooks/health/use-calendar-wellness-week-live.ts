/**
 * useCalendarWellnessWeekLive — reactive read of the visible week's
 * wellness for the calendar band.
 *
 * A single `useLiveQuery` callback `Promise.all`s four
 * `getByProfileAndDateRange` scans (sleep, HRV, weight, daily/steps) and
 * reduces them to a per-day map. The single query is for atomicity — a
 * day's badges resolve in one loading transition, never one at a time —
 * mirroring the multi-step async reduce in `use-matched-sessions.ts`.
 *
 * Contract: `undefined` = the week's wellness is still loading; an absent
 * day key = no wellness that day; a present day key always carries ≥1
 * metric (see `reduceWellnessByDay`).
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { DayWellness } from "../../types/health/day-wellness";
import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import { reduceWellnessByDay } from "./calendar-wellness-reduce";
import { queryHealthRangeAsync } from "./health-live-query";

export const useCalendarWellnessWeekLive = (
  profileId: string | null,
  weekStart: string,
  weekEnd: string
): Record<string, DayWellness> | undefined =>
  useLiveQuery<Record<string, DayWellness>>(async () => {
    if (!profileId || !weekStart || !weekEnd) return {};
    const range = { start: weekStart, end: weekEnd };
    const [sleep, hrv, weight, daily] = await Promise.all([
      queryHealthRangeAsync<HealthSleepRecord>("healthSleep", profileId, range),
      queryHealthRangeAsync<HealthHrvRecord>("healthHrv", profileId, range),
      queryHealthRangeAsync<HealthWeightRecord>(
        "healthWeight",
        profileId,
        range
      ),
      queryHealthRangeAsync<HealthDailyRecord>("healthDaily", profileId, range),
    ]);
    return reduceWellnessByDay({ sleep, hrv, weight, daily });
  }, [profileId, weekStart, weekEnd]);
