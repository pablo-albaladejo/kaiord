/**
 * useHealthDailyHistoryLive — reactive read of daily-wellness records
 * for a profile across an arbitrary date range (steps trend source).
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthDailyRecord } from "../../types/health/health-records";
import {
  type HealthDateRange,
  queryHealthRangeAsync,
} from "./health-live-query";

export const useHealthDailyHistoryLive = (
  profileId: string,
  range: HealthDateRange
): HealthDailyRecord[] | undefined =>
  useLiveQuery<HealthDailyRecord[]>(
    () =>
      queryHealthRangeAsync<HealthDailyRecord>("healthDaily", profileId, range),
    [profileId, range.start, range.end]
  );
