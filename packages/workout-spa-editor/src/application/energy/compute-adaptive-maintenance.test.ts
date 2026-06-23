import { MIN_ADAPTIVE_DAYS } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { addDaysIso } from "../../components/pages/Daily/today-dates";
import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { computeAdaptiveMaintenance } from "./compute-adaptive-maintenance";

const PROFILE_ID = "p1";
const AS_OF = "2026-06-28";
const WINDOW_DAYS = 28;
const INTAKE_KCAL = 2200;
const START_WEIGHT_KG = 82;
const END_WEIGHT_KG = 80;
const RISING_START_KG = 79;
const RISING_END_KG = 81;
const FLAT_START_KG = 81;

const profile: Profile = {
  id: PROFILE_ID,
  name: "Athlete",
  bodyWeight: 80,
  height: 178,
  birthDate: "1990-06-21",
  sex: "male",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const weight = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: kg,
  } as unknown as HealthWeightRecord["krd"],
});

const seedIntakeRange = async (
  persistence: PersistencePort,
  days: number
): Promise<void> => {
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(AS_OF, -i);
    await persistence.intakeEntries.put({
      id: `i-${date}`,
      profileId: PROFILE_ID,
      date,
      loggedAt: `${date}T12:00:00.000Z`,
      kcal: INTAKE_KCAL,
      proteinG: 30,
      carbG: 40,
      fatG: 10,
    });
  }
};

describe("computeAdaptiveMaintenance", () => {
  it("should estimate maintenance above intake for a downward weight trend", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedIntakeRange(persistence, WINDOW_DAYS);
    await persistence.healthWeight.put(
      weight(addDaysIso(AS_OF, -WINDOW_DAYS), START_WEIGHT_KG)
    );
    await persistence.healthWeight.put(weight(AS_OF, END_WEIGHT_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result).not.toBeNull();
    expect(result?.maintenanceKcal).toBeGreaterThan(INTAKE_KCAL);
    expect(result?.isEstimate).toBe(true);
  });

  it("should estimate maintenance below intake for an upward weight trend", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedIntakeRange(persistence, WINDOW_DAYS);
    await persistence.healthWeight.put(
      weight(addDaysIso(AS_OF, -WINDOW_DAYS), RISING_START_KG)
    );
    await persistence.healthWeight.put(weight(AS_OF, RISING_END_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result).not.toBeNull();
    expect(result?.maintenanceKcal).toBeLessThan(INTAKE_KCAL);
  });

  it("should report sufficientData once enough tracked days exist", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedIntakeRange(persistence, MIN_ADAPTIVE_DAYS);
    await persistence.healthWeight.put(
      weight(addDaysIso(AS_OF, -WINDOW_DAYS), FLAT_START_KG)
    );
    await persistence.healthWeight.put(weight(AS_OF, END_WEIGHT_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result?.sufficientData).toBe(true);
  });

  it("should suppress sufficientData below the activation threshold", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedIntakeRange(persistence, MIN_ADAPTIVE_DAYS - 1);
    await persistence.healthWeight.put(
      weight(addDaysIso(AS_OF, -WINDOW_DAYS), FLAT_START_KG)
    );
    await persistence.healthWeight.put(weight(AS_OF, END_WEIGHT_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result?.sufficientData).toBe(false);
  });

  it("should return null when no intake was logged in the window", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await persistence.healthWeight.put(
      weight(addDaysIso(AS_OF, -WINDOW_DAYS), FLAT_START_KG)
    );
    await persistence.healthWeight.put(weight(AS_OF, END_WEIGHT_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result).toBeNull();
  });

  it("should return null when there are too few weigh-ins to span a change", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedIntakeRange(persistence, WINDOW_DAYS);
    await persistence.healthWeight.put(weight(AS_OF, END_WEIGHT_KG));

    // Act
    const result = await computeAdaptiveMaintenance({
      persistence,
      profileId: PROFILE_ID,
      asOfDate: AS_OF,
    });

    // Assert
    expect(result).toBeNull();
  });
});
