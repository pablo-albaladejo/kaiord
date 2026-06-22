import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { Profile } from "../../types/profile";
import { buildEnergyRollup } from "./build-energy-rollup";

const PROFILE_ID = "p1";
const START = "2026-06-15";
const END = "2026-06-17";
const DAYS_IN_RANGE = 3;
const ACTIVE_KCAL = 600;
const RESTING_KCAL = 1700;
const INTAKE_KCAL = 2000;
const EXPENDITURE_KCAL = 2300;
const TRACKED_DAYS = 2;

const profile: Profile = {
  id: PROFILE_ID,
  name: "Athlete",
  bodyWeight: 70,
  height: 178,
  birthDate: "1990-06-21",
  sex: "male",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const seedWellness = (
  persistence: PersistencePort,
  date: string,
  active: number,
  resting: number
) =>
  persistence.healthDaily.put({
    id: `w-${date}`,
    profileId: PROFILE_ID,
    date,
    krd: {
      kind: "daily",
      version: "2.0",
      date,
      steps: 9000,
      activeCalories: active,
      restingCalories: resting,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    },
  });

const seedIntake = (persistence: PersistencePort, date: string, kcal: number) =>
  persistence.intakeEntries.put({
    id: `i-${date}`,
    profileId: PROFILE_ID,
    date,
    loggedAt: `${date}T12:00:00.000Z`,
    kcal,
    proteinG: 30,
    carbG: 40,
    fatG: 10,
  });

describe("buildEnergyRollup", () => {
  it("should aggregate resolvable days into totals and averages", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedWellness(persistence, "2026-06-15", ACTIVE_KCAL, RESTING_KCAL);
    await seedWellness(persistence, "2026-06-16", ACTIVE_KCAL, RESTING_KCAL);
    await seedWellness(persistence, "2026-06-17", ACTIVE_KCAL, RESTING_KCAL);
    await seedIntake(persistence, "2026-06-15", INTAKE_KCAL);
    await seedIntake(persistence, "2026-06-16", INTAKE_KCAL);

    // Act
    const rollup = await buildEnergyRollup({
      persistence,
      profileId: PROFILE_ID,
      startDate: START,
      endDate: END,
    });

    // Assert
    expect(rollup.daysInRange).toBe(DAYS_IN_RANGE);
    expect(rollup.dayCount).toBe(DAYS_IN_RANGE);
    expect(rollup.totalExpenditureKcal).toBe(EXPENDITURE_KCAL * DAYS_IN_RANGE);
    expect(rollup.daysTracked).toBe(TRACKED_DAYS);
    expect(rollup.avgExpenditureKcal).toBe(EXPENDITURE_KCAL);
  });

  it("should report untracked-intake days without averaging in a zero", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedWellness(persistence, "2026-06-15", ACTIVE_KCAL, RESTING_KCAL);
    await seedIntake(persistence, "2026-06-15", INTAKE_KCAL);

    // Act
    const rollup = await buildEnergyRollup({
      persistence,
      profileId: PROFILE_ID,
      startDate: "2026-06-15",
      endDate: "2026-06-15",
    });

    // Assert
    expect(rollup.daysTracked).toBe(1);
    expect(rollup.avgIntakeKcal).toBe(INTAKE_KCAL);
  });

  it("should skip gated days when the profile is BMR-incomplete", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put({
      ...profile,
      height: undefined,
      birthDate: undefined,
      sex: undefined,
    });

    // Act
    const rollup = await buildEnergyRollup({
      persistence,
      profileId: PROFILE_ID,
      startDate: START,
      endDate: END,
    });

    // Assert
    expect(rollup.daysInRange).toBe(DAYS_IN_RANGE);
    expect(rollup.daysResolved).toBe(0);
    expect(rollup.totalExpenditureKcal).toBe(0);
  });
});
