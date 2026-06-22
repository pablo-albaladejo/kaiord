/**
 * useAdaptiveMaintenance — reactive read of the adaptive maintenance estimate
 * (logged intake vs the smoothed weight trend) for a (profileId, asOfDate).
 *
 * The whole `computeAdaptiveMaintenance` read runs inside ONE `useLiveQuery`
 * callback so every table it touches (intake, weight, profile, wellness) is
 * observed by a single subscription. Returns `undefined` while loading,
 * and `null` when there is no usable data. Returns `null` when `profileId` is
 * null.
 */
import type { AdaptiveTdeeResult } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import { computeAdaptiveMaintenance } from "../../application/energy/compute-adaptive-maintenance";
import { usePersistence } from "../../contexts/persistence-context";

export const useAdaptiveMaintenance = (
  profileId: string | null,
  asOfDate: string
): AdaptiveTdeeResult | null | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<AdaptiveTdeeResult | null>(() => {
    if (!profileId) return Promise.resolve(null);
    return computeAdaptiveMaintenance({ persistence, profileId, asOfDate });
  }, [persistence, profileId, asOfDate]);
};
