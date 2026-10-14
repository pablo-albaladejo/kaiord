/**
 * useHealthDailyHistoryLive — reactive read of daily-wellness readings
 * (one per day, combined across sources) for a profile across an arbitrary
 * date range (steps trend source).
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthDailyRecord } from "../../types/health/health-records";
import { queryDailyWellnessRangeAsync } from "./daily-wellness-live-query";
import type { HealthDateRange } from "./health-live-query";

export const useHealthDailyHistoryLive = (
  profileId: string,
  range: HealthDateRange
): HealthDailyRecord[] | undefined =>
  useLiveQuery<HealthDailyRecord[]>(
    () => queryDailyWellnessRangeAsync(profileId, range),
    [profileId, range.start, range.end]
  );
