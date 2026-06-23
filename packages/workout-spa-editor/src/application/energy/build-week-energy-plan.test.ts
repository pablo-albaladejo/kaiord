import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { Profile } from "../../types/profile";
import { buildWeekEnergyPlan } from "./build-week-energy-plan";

const PROFILE_ID = "p1";
// Monday-to-Sunday week containing this Wednesday.
const MID_WEEK = "2026-06-17";
const MONDAY = "2026-06-15";
const WEDNESDAY = "2026-06-17";
const DAYS_IN_WEEK = 7;

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

const workout: Workout = {
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

const seedWorkout = (persistence: PersistencePort, date: string) =>
  persistence.workouts.put({
    id: `wk-${date}`,
    profileId: PROFILE_ID,
    date,
    sport: "training",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "scheduled",
    raw: null,
    krd: createWorkoutKRD(workout),
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

describe("buildWeekEnergyPlan", () => {
  it("should return seven Monday-to-Sunday rows starting on Monday", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);

    // Act
    const rows = await buildWeekEnergyPlan({
      persistence,
      profileId: PROFILE_ID,
      date: MID_WEEK,
    });

    // Assert
    expect(rows).toHaveLength(DAYS_IN_WEEK);
    expect(rows[0]!.date).toBe(MONDAY);
  });

  it("should flag only the day that has a scheduled workout", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    await seedWorkout(persistence, WEDNESDAY);

    // Act
    const rows = await buildWeekEnergyPlan({
      persistence,
      profileId: PROFILE_ID,
      date: MID_WEEK,
    });

    // Assert
    const flagged = rows.filter((row) => row.hasWorkout);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.date).toBe(WEDNESDAY);
  });

  it("should predict a positive expenditure for a BMR-resolvable day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);

    // Act
    const rows = await buildWeekEnergyPlan({
      persistence,
      profileId: PROFILE_ID,
      date: MID_WEEK,
    });

    // Assert
    expect(rows[0]!.expenditureKcal).not.toBeNull();
    expect(rows[0]!.expenditureKcal!).toBeGreaterThan(0);
  });
});
