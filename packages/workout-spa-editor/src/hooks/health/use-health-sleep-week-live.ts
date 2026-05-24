/**
 * useHealthSleepWeekLive — reactive read of sleep records for a
 * profile across a calendar week. Returns `undefined` while loading
 * and `[]` for an empty week (consumers MUST distinguish the two).
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthSleepRecord } from "../../types/health/health-records";
import {
  type HealthDateRange,
  queryHealthRangeAsync,
} from "./health-live-query";

export const useHealthSleepWeekLive = (
  profileId: string,
  range: HealthDateRange
): HealthSleepRecord[] | undefined =>
  useLiveQuery<HealthSleepRecord[]>(
    () =>
      queryHealthRangeAsync<HealthSleepRecord>("healthSleep", profileId, range),
    [profileId, range.start, range.end]
  );
