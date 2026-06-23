/**
 * useEnergyRollup — reactive read of the energy roll-up (totals + averages over
 * a date range) for a (profileId, startDate, endDate).
 *
 * The whole `buildEnergyRollup` read runs inside ONE `useLiveQuery` callback so
 * every table each per-day balance touches is observed by a single subscription
 * (any intake/wellness/goal write in the window re-resolves the roll-up).
 * Returns `undefined` while loading and when `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import {
  buildEnergyRollup,
  type EnergyRollup,
} from "../../application/energy/build-energy-rollup";
import { usePersistence } from "../../contexts/persistence-context";

export const useEnergyRollup = (
  profileId: string | null,
  startDate: string,
  endDate: string
): EnergyRollup | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<EnergyRollup | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return buildEnergyRollup({ persistence, profileId, startDate, endDate });
  }, [persistence, profileId, startDate, endDate]);
};
