/**
 * use-goal-baseline — reactive read of the inputs the goal preview needs:
 * the modeled maintenance expenditure (≈ BMR) and a default start weight
 * (the athlete's current weight: latest weigh-in, else profile bodyWeight).
 * Returns `undefined` while loading and `null` maintenance when the profile
 * lacks BMR inputs (preview unavailable).
 */
import { useLiveQuery } from "dexie-react-hooks";

import { loadDayEnergySources } from "../../../application/energy/load-day-energy-sources";
import { resolveGoalMaintenance } from "../../../application/energy/resolve-goal-maintenance";
import { getCurrentWeightKg } from "../../../application/health/current-weight";
import { usePersistence } from "../../../contexts/persistence-context";

export type GoalBaseline = {
  maintenanceKcal: number | null;
  defaultStartWeightKg: number | null;
};

export const useGoalBaseline = (
  profileId: string,
  today: string
): GoalBaseline | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<GoalBaseline | undefined>(async () => {
    const sources = await loadDayEnergySources(persistence, profileId, today);
    const maintenance = resolveGoalMaintenance(sources, today);
    return {
      maintenanceKcal: maintenance?.maintenanceKcal ?? null,
      defaultStartWeightKg:
        getCurrentWeightKg(sources.profile, sources.latestWeight) ?? null,
    };
  }, [persistence, profileId, today]);
};
