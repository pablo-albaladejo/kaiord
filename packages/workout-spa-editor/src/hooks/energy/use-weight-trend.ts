/**
 * useWeightTrend — reactive read of the weight-trend view-model (raw weigh-ins +
 * EMA-smoothed trend + goal target-weight line) for a (profileId, date range).
 *
 * The weigh-in scan and the active goal read run inside ONE `useLiveQuery`
 * callback so both tables are observed by a single subscription (a new weigh-in
 * or a goal edit re-resolves the whole trend in one transition). Returns
 * `undefined` while loading and when `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import {
  buildWeightTrend,
  type WeightTrend,
} from "../../application/energy/build-weight-trend";
import { usePersistence } from "../../contexts/persistence-context";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { HealthDateRange } from "../health/health-live-query";
import { queryHealthRangeAsync } from "../health/health-live-query";

export const useWeightTrend = (
  profileId: string | null,
  range: HealthDateRange,
  windowDays?: number
): WeightTrend | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<WeightTrend | undefined>(async () => {
    if (!profileId) return undefined;
    const [weighIns, target] = await Promise.all([
      queryHealthRangeAsync<HealthWeightRecord>(
        "healthWeight",
        profileId,
        range
      ),
      persistence.energyTargets.get(profileId),
    ]);
    return buildWeightTrend({ weighIns, target, windowDays });
  }, [persistence, profileId, range.start, range.end, windowDays]);
};
