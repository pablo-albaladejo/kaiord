/**
 * useDayEnergyBalance — reactive read of the per-day energy-balance result for
 * a (profileId, date), recomputed when any contributing store changes (intake,
 * daily wellness, body composition, profile, or goal target).
 *
 * The whole `buildDayEnergyBalance` read runs inside ONE `useLiveQuery`
 * callback so every table it touches is observed by a single subscription
 * (design: one query per concern). Returns `undefined` while loading and when
 * `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { buildDayEnergyBalance } from "../../application/energy/build-day-energy-balance";
import type { DayEnergyBalanceResult } from "../../application/energy/day-energy-balance-result";
import { usePersistence } from "../../contexts/persistence-context";

export const useDayEnergyBalance = (
  profileId: string | null,
  date: string
): DayEnergyBalanceResult | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<DayEnergyBalanceResult | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return buildDayEnergyBalance({ persistence, profileId, date });
  }, [persistence, profileId, date]);
};
