/**
 * useHealthStressDayLive — reactive read of every stress episode
 * recorded for `day` (YYYY-MM-DD) under a profile.
 */
import { useLiveQuery } from "dexie-react-hooks";

import type { HealthStressRecord } from "../../types/health/health-records";
import { queryHealthRangeAsync } from "./health-live-query";

export const useHealthStressDayLive = (
  profileId: string,
  day: string
): HealthStressRecord[] | undefined =>
  useLiveQuery<HealthStressRecord[]>(
    () =>
      queryHealthRangeAsync<HealthStressRecord>("healthStress", profileId, {
        start: day,
        end: day,
      }),
    [profileId, day]
  );
