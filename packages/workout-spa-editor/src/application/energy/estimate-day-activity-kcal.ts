/**
 * Estimates a day's expected activity kcal from its planned workout(s).
 *
 * Reads the day's profile-scoped workouts via the `PersistencePort`, extracts
 * each structured workout's sport + duration (and running distance when known)
 * with the shared `calculateWorkoutStats` helper, then sums the core
 * `estimateExpectedActivityKcal` per workout.
 *
 * Robustness over the power tier: structured targets are zone/FTP-based, so
 * resolving absolute watts is fragile. We pass no `avgPowerWatts`, letting the
 * core estimator fall back to the running-distance or MET tier — both depend
 * only on duration, sport, and weight, which we can resolve reliably.
 */

import { estimateExpectedActivityKcal } from "@kaiord/core";

import type { PersistencePort } from "../../ports/persistence-port";
import { toWorkoutActivityInput } from "./workout-activity-input";

export type EstimateDayActivityKcalInput = {
  persistence: PersistencePort;
  profileId: string;
  /** ISO date (YYYY-MM-DD) whose planned workouts are estimated. */
  date: string;
  /** Bodyweight (kg) used by the MET / running-distance tiers. */
  weightKg: number;
};

/** Sum of the day's planned-workout expected activity kcal (0 when none). */
export const estimateDayActivityKcal = async ({
  persistence,
  profileId,
  date,
  weightKg,
}: EstimateDayActivityKcalInput): Promise<number> => {
  const records = await persistence.workouts.getByDateRange(date, date);
  let total = 0;
  for (const record of records) {
    if (record.profileId !== profileId) continue;
    const input = toWorkoutActivityInput(record, weightKg);
    if (input) total += estimateExpectedActivityKcal(input);
  }
  return total;
};
