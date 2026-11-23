/**
 * Loads every persisted source `buildDayEnergyBalance` needs for one day:
 * the profile, that day's daily-wellness reading (combined across sources),
 * the latest body-composition record up to the date, the current weigh-in
 * (`current-weight.ts`), the day's intake
 * entries, and the active goal.
 *
 * All reads go through the `PersistencePort` so the use-case never touches
 * Dexie directly and stays adapter-agnostic (Dexie in the app, in-memory in
 * tests).
 */

import type { BodyComposition } from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type {
  HealthDailyRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import type { Profile } from "../../types/profile";
import { loadLatestWeighIn } from "../health/current-weight";
import { latestUpTo } from "../health/latest-measurement";
import { loadDailyWellness } from "../health/load-daily-wellness";

const EARLIEST_DATE = "0000-01-01";

export type DayEnergySources = {
  profile: Profile | undefined;
  wellness: HealthDailyRecord | undefined;
  bodyComposition: HealthRecord<BodyComposition> | undefined;
  latestWeight: HealthWeightRecord | undefined;
  intakeEntries: IntakeEntryRecord[];
  target: EnergyTargetRecord | undefined;
};

export const loadDayEnergySources = async (
  persistence: PersistencePort,
  profileId: string,
  date: string
): Promise<DayEnergySources> => {
  const [
    profile,
    wellnessRows,
    bodyCompRows,
    latestWeight,
    intakeEntries,
    target,
  ] = await Promise.all([
    persistence.profiles.getById(profileId),
    loadDailyWellness(persistence, profileId, { start: date, end: date }),
    persistence.healthBodyComposition.getByProfileAndDateRange(
      profileId,
      EARLIEST_DATE,
      date
    ),
    loadLatestWeighIn(persistence, profileId, date),
    persistence.intakeEntries.getByProfileAndDate(profileId, date),
    persistence.energyTargets.get(profileId),
  ]);
  return {
    profile,
    wellness: wellnessRows[0],
    bodyComposition: latestUpTo(bodyCompRows),
    latestWeight,
    intakeEntries,
    target,
  };
};
