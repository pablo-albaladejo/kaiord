import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../types/calendar-record";
import { estimateDayActivityKcal } from "./estimate-day-activity-kcal";

const PROFILE_ID = "p1";
const OTHER_PROFILE_ID = "p2";
const DATE = "2026-06-21";
const WEIGHT_KG = 70;
const ONE_HOUR_SEC = 3600;
const HALF_HOUR_SEC = 1800;
// 1 h training (MET 5.0) at 70 kg → 5 · 1 · 70 = 350 kcal (MET tier).
const TRAINING_KCAL = 350;
// 30 min running (MET 9.8) at 70 kg → 9.8 · 0.5 · 70 = 343 kcal (MET tier).
const RUNNING_KCAL = 343;

const timeStep = (seconds: number) => ({
  stepIndex: 0,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds },
  targetType: "open" as const,
  target: { type: "open" as const },
  intensity: "active" as const,
});

const workoutOf = (sport: Workout["sport"], seconds: number): Workout => ({
  sport,
  steps: [timeStep(seconds)],
});

const recordOf = (
  id: string,
  workout: Workout,
  profileId = PROFILE_ID
): WorkoutRecord =>
  ({
    id,
    profileId,
    date: DATE,
    sport: workout.sport,
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
  }) as WorkoutRecord;

const seed = (persistence: PersistencePort, record: WorkoutRecord) =>
  persistence.workouts.put(record);

describe("estimateDayActivityKcal", () => {
  it("should return zero when no workout is planned for the day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const kcal = await estimateDayActivityKcal({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      weightKg: WEIGHT_KG,
    });

    // Assert
    expect(kcal).toBe(0);
  });

  it("should estimate a MET-tier workout from sport, duration, and weight", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence, recordOf("a", workoutOf("training", ONE_HOUR_SEC)));

    // Act
    const kcal = await estimateDayActivityKcal({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      weightKg: WEIGHT_KG,
    });

    // Assert
    expect(kcal).toBe(TRAINING_KCAL);
  });

  it("should sum the estimates of multiple workouts on the same day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence, recordOf("a", workoutOf("training", ONE_HOUR_SEC)));
    await seed(persistence, recordOf("b", workoutOf("running", HALF_HOUR_SEC)));

    // Act
    const kcal = await estimateDayActivityKcal({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      weightKg: WEIGHT_KG,
    });

    // Assert
    expect(kcal).toBe(TRAINING_KCAL + RUNNING_KCAL);
  });

  it("should ignore workouts belonging to another profile", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(
      persistence,
      recordOf("a", workoutOf("training", ONE_HOUR_SEC), OTHER_PROFILE_ID)
    );

    // Act
    const kcal = await estimateDayActivityKcal({
      persistence,
      profileId: PROFILE_ID,
      date: DATE,
      weightKg: WEIGHT_KG,
    });

    // Assert
    expect(kcal).toBe(0);
  });
});
