/**
 * useHealthDailyTodayLive — reactive read of the daily-wellness
 * record for `today` (YYYY-MM-DD). Returns `undefined` while loading
 * AND when no record exists for that day (the calling component
 * treats both as "no data yet").
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthDailyRecord } from "../../types/health/health-records";
import { queryHealthDayAsync } from "./health-live-query";

export const useHealthDailyTodayLive = (
  profileId: string,
  today: string
): HealthDailyRecord | undefined =>
  useLiveQuery<HealthDailyRecord | undefined>(
    () =>
      queryHealthDayAsync<HealthDailyRecord>("healthDaily", profileId, today),
    [profileId, today]
  );
