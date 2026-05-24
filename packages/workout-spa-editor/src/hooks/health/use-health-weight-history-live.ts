/**
 * useHealthWeightHistoryLive — reactive read of weight records for a
 * profile across an arbitrary date range.
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthWeightRecord } from "../../types/health/health-records";
import {
  type HealthDateRange,
  queryHealthRangeAsync,
} from "./health-live-query";

export const useHealthWeightHistoryLive = (
  profileId: string,
  range: HealthDateRange
): HealthWeightRecord[] | undefined =>
  useLiveQuery<HealthWeightRecord[]>(
    () =>
      queryHealthRangeAsync<HealthWeightRecord>(
        "healthWeight",
        profileId,
        range
      ),
    [profileId, range.start, range.end]
  );
