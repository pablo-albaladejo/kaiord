/**
 * useDayEnergyBalance — reactive read of the per-day energy-balance result for
 * a (profileId, date), recomputed when any contributing store changes (intake,
 * daily wellness, body composition, profile, or goal target).
 *
 * The whole `buildDayEnergyBalance` read runs inside ONE `useLiveQuery`
 * callback so every table it touches is observed by a single subscription
 * (design: one query per concern). Returns `undefined` while loading and when
 * `profileId` is null.
 *
 * `today` is passed explicitly as the real local day so the goal horizon is
 * measured from the actual current date, not the displayed `date` — viewing a
 * past or future day must not shrink/grow the months-to-goal and distort the
 * daily target.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { buildDayEnergyBalance } from "../../application/energy/build-day-energy-balance";
import type { DayEnergyBalanceResult } from "../../application/energy/day-energy-balance-result";
import { usePersistence } from "../../contexts/persistence-context";
import { todayIsoDate } from "../../utils/today-iso-date";

export const useDayEnergyBalance = (
  profileId: string | null,
  date: string
): DayEnergyBalanceResult | undefined => {
  const persistence = usePersistence();
  const today = todayIsoDate();
  return useLiveQuery<DayEnergyBalanceResult | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return buildDayEnergyBalance({ persistence, profileId, date, today });
  }, [persistence, profileId, date, today]);
};
