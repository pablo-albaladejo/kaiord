/**
 * useWeeklyEnergyPlan — reactive read of the forward weekly energy plan (seven
 * Monday-to-Sunday rows) for a (profileId, week-of date).
 *
 * The whole `buildWeekEnergyPlan` read runs inside ONE `useLiveQuery` callback
 * so every table it touches (workouts, wellness, profile, goal, intake) is
 * observed by a single subscription. Returns `undefined` while loading and when
 * `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { buildWeekEnergyPlan } from "../../application/energy/build-week-energy-plan";
import type { WeekEnergyPlanRow } from "../../application/energy/week-energy-plan-row";
import { usePersistence } from "../../contexts/persistence-context";

export const useWeeklyEnergyPlan = (
  profileId: string | null,
  date: string
): WeekEnergyPlanRow[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<WeekEnergyPlanRow[] | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return buildWeekEnergyPlan({ persistence, profileId, date });
  }, [persistence, profileId, date]);
};
