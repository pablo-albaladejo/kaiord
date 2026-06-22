/**
 * Resolves the bodyweight (kg) used to estimate a day's expected activity kcal
 * (latest weigh-in up to the day, falling back to the profile's bodyweight) and
 * the day's expected activity kcal from its planned workouts.
 *
 * Weight is `null` when neither source is known, so we estimate no activity
 * rather than inventing a number. Mirrors the goal path's current-weight rule.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import { estimateDayActivityKcal } from "./estimate-day-activity-kcal";
import type { DayEnergySources } from "./load-day-energy-sources";

export const resolveDayWeightKg = (sources: DayEnergySources): number | null =>
  sources.latestWeight?.krd.weightKilograms ??
  sources.profile?.bodyWeight ??
  null;

export const resolveDayActivityKcal = async (
  persistence: PersistencePort,
  profileId: string,
  date: string,
  sources: DayEnergySources
): Promise<number> => {
  const weightKg = resolveDayWeightKg(sources);
  if (weightKg === null) return 0;
  return estimateDayActivityKcal({ persistence, profileId, date, weightKg });
};
