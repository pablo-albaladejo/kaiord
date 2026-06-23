/**
 * `buildWeekEnergyPlan` — resolves the seven Monday-to-Sunday rows of a week's
 * forward energy plan for one profile: each day's predicted expenditure +
 * target and whether a workout is scheduled.
 *
 * Each day reuses `buildDayEnergyBalance` (so the per-day periodization, BMR
 * gating, and measured-vs-predicted labelling stay single-sourced) and a
 * profile-scoped workout lookup for the scheduled-sport flag.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import { buildDayEnergyBalance } from "./build-day-energy-balance";
import { weekDatesFrom } from "./week-dates";
import type { WeekEnergyPlanRow } from "./week-energy-plan-row";

export type BuildWeekEnergyPlanInput = {
  persistence: PersistencePort;
  profileId: string;
  /** Any ISO date (YYYY-MM-DD) inside the target week. */
  date: string;
};

const hasScheduledWorkout = async (
  persistence: PersistencePort,
  profileId: string,
  date: string
): Promise<boolean> => {
  const records = await persistence.workouts.getByDateRange(date, date);
  return records.some((record) => record.profileId === profileId);
};

const buildRow = async (
  persistence: PersistencePort,
  profileId: string,
  date: string
): Promise<WeekEnergyPlanRow> => {
  const [result, hasWorkout] = await Promise.all([
    buildDayEnergyBalance({ persistence, profileId, date }),
    hasScheduledWorkout(persistence, profileId, date),
  ]);
  if (result.gated) {
    return {
      date,
      expenditureKcal: null,
      targetKcal: null,
      hasWorkout,
      source: null,
    };
  }
  return {
    date,
    expenditureKcal: result.balance.expenditure_kcal,
    targetKcal: result.balance.target_kcal,
    hasWorkout,
    source: result.balance.source,
  };
};

export const buildWeekEnergyPlan = async ({
  persistence,
  profileId,
  date,
}: BuildWeekEnergyPlanInput): Promise<WeekEnergyPlanRow[]> =>
  Promise.all(
    weekDatesFrom(date).map((dayIso) =>
      buildRow(persistence, profileId, dayIso)
    )
  );
