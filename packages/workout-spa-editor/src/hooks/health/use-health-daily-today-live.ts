/**
 * useHealthDailyTodayLive — reactive read of the daily-wellness reading
 * for `today` (YYYY-MM-DD), combined across sources. Returns `undefined`
 * while loading AND when no record exists for that day (the calling
 * component treats both as "no data yet").
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthDailyRecord } from "../../types/health/health-records";
import { queryDailyWellnessDayAsync } from "./daily-wellness-live-query";

export const useHealthDailyTodayLive = (
  profileId: string,
  today: string
): HealthDailyRecord | undefined =>
  useLiveQuery<HealthDailyRecord | undefined>(
    () => queryDailyWellnessDayAsync(profileId, today),
    [profileId, today]
  );
