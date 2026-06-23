/**
 * Loads every persisted source `buildDayEnergyBalance` needs for one day:
 * the profile, that day's daily-wellness record, the latest body-composition
 * record up to the date, the day's intake entries, and the active goal.
 *
 * All reads go through the `PersistencePort` so the use-case never touches
 * Dexie directly and stays adapter-agnostic (Dexie in the app, in-memory in
 * tests).
 */

import type { BodyComposition, DailyWellness } from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";
import type { PersistencePort } from "../../ports/persistence-port";
import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import type { Profile } from "../../types/profile";

const EARLIEST_DATE = "0000-01-01";

export type DayEnergySources = {
  profile: Profile | undefined;
  wellness: HealthRecord<DailyWellness> | undefined;
  bodyComposition: HealthRecord<BodyComposition> | undefined;
  latestWeight: HealthWeightRecord | undefined;
  intakeEntries: IntakeEntryRecord[];
  target: EnergyTargetRecord | undefined;
};

const latestUpTo = <T extends { date: string }>(records: T[]): T | undefined =>
  records.reduce<T | undefined>(
    (latest, record) =>
      latest && latest.date >= record.date ? latest : record,
    undefined
  );

export const loadDayEnergySources = async (
  persistence: PersistencePort,
  profileId: string,
  date: string
): Promise<DayEnergySources> => {
  const [
    profile,
    wellnessRows,
    bodyCompRows,
    weightRows,
    intakeEntries,
    target,
  ] = await Promise.all([
    persistence.profiles.getById(profileId),
    persistence.healthDaily.getByProfileAndDateRange(profileId, date, date),
    persistence.healthBodyComposition.getByProfileAndDateRange(
      profileId,
      EARLIEST_DATE,
      date
    ),
    persistence.healthWeight.getByProfileAndDateRange(
      profileId,
      EARLIEST_DATE,
      date
    ),
    persistence.intakeEntries.getByProfileAndDate(profileId, date),
    persistence.energyTargets.get(profileId),
  ]);
  return {
    profile,
    wellness: wellnessRows[0],
    bodyComposition: latestUpTo(bodyCompRows),
    latestWeight: latestUpTo(weightRows),
    intakeEntries,
    target,
  };
};
