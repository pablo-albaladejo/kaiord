import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { Profile } from "../../types/profile";
import { buildDayEnergyBalance } from "./build-day-energy-balance";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const PROFILE_KG = 90;
const WEIGH_IN_KG = 70;

const profile = (bodyWeight: number | undefined): Profile => ({
  id: PROFILE_ID,
  name: "Athlete",
  bodyWeight,
  height: 178,
  birthDate: "1990-06-21",
  sex: "male",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const seedWeighIn = (persistence: PersistencePort, kg: number) =>
  persistence.healthWeight.put({
    id: "w1",
    profileId: PROFILE_ID,
    date: "2026-06-20",
    krd: {
      kind: "weight",
      version: "2.0",
      measuredAt: "2026-06-20T07:00:00.000Z",
      weightKilograms: kg,
    },
  });

const predictedKcal = async (persistence: PersistencePort) => {
  const result = await buildDayEnergyBalance({
    persistence,
    profileId: PROFILE_ID,
    date: DATE,
  });
  if (result.gated) return null;
  return result.balance.expenditure_kcal;
};

describe("buildDayEnergyBalance current weight", () => {
  it("should not gate a profile without bodyWeight when a weigh-in exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile(undefined));
    await seedWeighIn(persistence, WEIGH_IN_KG);

    // Act
    const kcal = await predictedKcal(persistence);

    // Assert
    expect(kcal).not.toBeNull();
  });

  it("should compute BMR from the latest weigh-in, not the profile weight", async () => {
    // Arrange
    const fromWeighIn = createInMemoryPersistence();
    await fromWeighIn.profiles.put(profile(PROFILE_KG));
    await seedWeighIn(fromWeighIn, WEIGH_IN_KG);
    const fromProfile = createInMemoryPersistence();
    await fromProfile.profiles.put(profile(WEIGH_IN_KG));

    // Act
    const withWeighIn = await predictedKcal(fromWeighIn);
    const withProfileOnly = await predictedKcal(fromProfile);

    // Assert
    expect(withWeighIn).toBe(withProfileOnly);
  });
});
