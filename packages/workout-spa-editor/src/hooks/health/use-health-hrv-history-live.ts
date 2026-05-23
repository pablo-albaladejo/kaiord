/**
 * useHealthHrvHistoryLive — reactive read of HRV records for a profile
 * across an arbitrary date range.
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthHrvRecord } from "../../types/health/health-records";
import {
  type HealthDateRange,
  queryHealthRangeAsync,
} from "./health-live-query";

export const useHealthHrvHistoryLive = (
  profileId: string,
  range: HealthDateRange
): HealthHrvRecord[] | undefined =>
  useLiveQuery<HealthHrvRecord[]>(
    () => queryHealthRangeAsync<HealthHrvRecord>("healthHrv", profileId, range),
    [profileId, range.start, range.end]
  );
