import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { addDaysIso } from "../../components/pages/Daily/today-dates";
import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { buildDayEnergyBalance } from "./build-day-energy-balance";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const INTAKE_KCAL = 1700;
const ENTRY_A_KCAL = 600;
const ENTRY_B_KCAL = 400;
const TOTAL_INTAKE_KCAL = ENTRY_A_KCAL + ENTRY_B_KCAL;
const EXPECTED_EXPENDITURE = 2300;
const EXPECTED_DEFICIT = -600;
const TOTAL_PROTEIN_G = 60;
const TOTAL_CARB_G = 80;
const TOTAL_FAT_G = 20;
const GOAL_START_WEIGHT_KG = 70;
const GOAL_TARGET_WEIGHT_KG = 67;
const AGGRESSIVE_TARGET_WEIGHT_KG = 60;
const ADAPTIVE_BODY_WEIGHT_KG = 80;
const ADAPTIVE_INTAKE_KCAL = 2200;
const SUFFICIENT_ADAPTIVE_DAYS = 16;
const THIN_ADAPTIVE_DAYS = 5;
const WINDOW_DAYS = 28;
const ADAPTIVE_START_WEIGHT_KG = 82;
const ADAPTIVE_END_WEIGHT_KG = 80;

const baseProfile: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
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

const seedProfile = async (
  persistence: PersistencePort,
  overrides: Partial<Profile> = {}
): Promise<void> => {
  await persistence.profiles.put({
    ...baseProfile,
    id: PROFILE_ID,
    ...overrides,
  });
};

const seedWellness = (persistence: PersistencePort) =>
  persistence.healthDaily.put({
    id: "w1",
    profileId: PROFILE_ID,
    date: DATE,
    krd: {
      kind: "daily",
      version: "2.0",
      date: DATE,
      steps: 9000,
      activeCalories: 600,
      restingCalories: 1700,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    },
  });

const seedIntake = (persistence: PersistencePort, kcal: number, id: string) =>
  persistence.intakeEntries.put({
    id,
    profileId: PROFILE_ID,
    date: DATE,
    loggedAt: "2026-06-21T12:00:00.000Z",
    kcal,
    proteinG: 30,
    carbG: 40,
    fatG: 10,
  });

// 1 h training (MET 5.0) at 70 kg → 5 · 1 · 70 = 350 kcal (MET tier).
const TRAINING_ACTIVITY_KCAL = 350;

const trainingWorkout: Workout = {
  sport: "training",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 3600 },
      targetType: "open",
      target: { type: "open" },
      intensity: "active",
    },
  ],
};

const seedWorkout = (persistence: PersistencePort) =>
  persistence.workouts.put({
    id: "11111111-1111-4111-8111-111111111112",
    profileId: PROFILE_ID,
    date: DATE,
    sport: "training",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "scheduled",
    raw: null,
    krd: createWorkoutKRD(trainingWorkout),
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-06-01T00:00:00.000Z",
  } as WorkoutRecord);

const weighIn = (date: string, kg: number): HealthWeightRecord => ({
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

const seedAdaptiveWindow = async (
  persistence: PersistencePort,
  kcal: number,
  days: number
): Promise<void> => {
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(DATE, -i);
    await persistence.intakeEntries.put({
      id: `adapt-${date}`,
      profileId: PROFILE_ID,
      date,
      loggedAt: `${date}T12:00:00.000Z`,
      kcal,
      proteinG: 30,
      carbG: 40,
      fatG: 10,
    });
  }
};

const seedGoal = (
  persistence: PersistencePort,
  overrides: Partial<{ targetWeightKg: number; targetDate: string }> = {}
) =>
  persistence.energyTargets.put({
    profileId: PROFILE_ID,
    goalType: "fat_loss",
    startWeightKg: GOAL_START_WEIGHT_KG,
    targetWeightKg: overrides.targetWeightKg ?? GOAL_TARGET_WEIGHT_KG,
    targetDate: overrides.targetDate ?? "2026-12-21",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  });

describe("buildDayEnergyBalance", () => {
  it("should report measured expenditure and net deficit from wellness and intake", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await seedIntake(persistence, INTAKE_KCAL, "i1");

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.source).toBe("measured");
    expect(result.balance.expenditure_kcal).toBe(EXPECTED_EXPENDITURE);
    expect(result.balance.net_kcal).toBe(EXPECTED_DEFICIT);
  });

  it("should sum logged entries into macro actuals", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await seedIntake(persistence, ENTRY_A_KCAL, "i1");
    await seedIntake(persistence, ENTRY_B_KCAL, "i2");

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.macro_actuals).toEqual({
      kcal: TOTAL_INTAKE_KCAL,
      protein_g: TOTAL_PROTEIN_G,
      carb_g: TOTAL_CARB_G,
      fat_g: TOTAL_FAT_G,
    });
  });

  it("should report untracked intake as null net when no entries exist", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.intake_kcal).toBeNull();
    expect(result.balance.net_kcal).toBeNull();
    expect(result.balance.macro_actuals).toBeUndefined();
  });

  it("should predict expenditure from BMR when wellness is absent", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.source).toBe("predicted");
    expect(result.balance.expenditure_kcal).toBeGreaterThan(0);
  });

  it("should add planned-workout activity to a predicted day's expenditure", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);

    // Act
    const rest = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });
    await seedWorkout(persistence);
    const sport = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    if (rest.gated || sport.gated) throw new Error("unexpected gate");
    expect(sport.balance.source).toBe("predicted");
    expect(sport.balance.expenditure_kcal).toBe(
      rest.balance.expenditure_kcal + TRAINING_ACTIVITY_KCAL
    );
  });

  it("should raise the goal target on a scheduled-sport day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await seedGoal(persistence);

    // Act
    const rest = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });
    await seedWorkout(persistence);
    const sport = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });

    // Assert
    if (rest.gated || sport.gated) throw new Error("unexpected gate");
    expect(sport.balance.target_kcal).toBe(
      (rest.balance.target_kcal ?? 0) + TRAINING_ACTIVITY_KCAL
    );
  });

  it("should derive a goal target and deficit delta when a goal is active", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await seedGoal(persistence);

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.target_kcal).not.toBeNull();
    expect(result.balance.macro_targets).toBeDefined();
    expect(result.goal?.goalType).toBe("fat_loss");
    expect(result.goal?.dailyDeltaKcal).toBeLessThan(0);
  });

  it("should flag a capped goal when the implied deficit exceeds the safe rate", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);
    await seedGoal(persistence, {
      targetWeightKg: AGGRESSIVE_TARGET_WEIGHT_KG,
      targetDate: "2026-07-21",
    });

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.goal?.capped).toBe(true);
    expect(result.goal?.capReason).not.toBeNull();
  });

  it("should leave the target null and goal null when no goal is active", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence);
    await seedWellness(persistence);

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(false);
    if (result.gated) return;
    expect(result.balance.target_kcal).toBeNull();
    expect(result.goal).toBeNull();
  });

  it("should apply adaptive maintenance to the target once history is sufficient", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence, { bodyWeight: ADAPTIVE_BODY_WEIGHT_KG });
    await seedGoal(persistence);
    await seedAdaptiveWindow(
      persistence,
      ADAPTIVE_INTAKE_KCAL,
      SUFFICIENT_ADAPTIVE_DAYS
    );
    await persistence.healthWeight.put(
      weighIn(addDaysIso(DATE, -WINDOW_DAYS), ADAPTIVE_START_WEIGHT_KG)
    );
    await persistence.healthWeight.put(weighIn(DATE, ADAPTIVE_END_WEIGHT_KG));

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });

    // Assert
    if (result.gated) throw new Error("unexpected gate");
    expect(result.goal?.maintenanceIsEstimate).toBe(true);
    expect(result.goal?.maintenanceKcal).toBeGreaterThan(ADAPTIVE_INTAKE_KCAL);
  });

  it("should keep modeled maintenance when adaptive history is too thin", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence, { bodyWeight: ADAPTIVE_BODY_WEIGHT_KG });
    await seedGoal(persistence);
    await seedAdaptiveWindow(
      persistence,
      ADAPTIVE_INTAKE_KCAL,
      THIN_ADAPTIVE_DAYS
    );
    await persistence.healthWeight.put(
      weighIn(addDaysIso(DATE, -WINDOW_DAYS), ADAPTIVE_START_WEIGHT_KG)
    );
    await persistence.healthWeight.put(weighIn(DATE, ADAPTIVE_END_WEIGHT_KG));

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      today: DATE,
    });

    // Assert
    if (result.gated) throw new Error("unexpected gate");
    expect(result.goal?.maintenanceIsEstimate).toBe(false);
  });

  it("should gate when no wellness and the profile lacks BMR inputs", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedProfile(persistence, {
      height: undefined,
      birthDate: undefined,
      sex: undefined,
    });

    // Act
    const result = await buildDayEnergyBalance({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
    });

    // Assert
    expect(result.gated).toBe(true);
    if (!result.gated) return;
    expect(result.reason).toBe("profile-incomplete");
  });
});
