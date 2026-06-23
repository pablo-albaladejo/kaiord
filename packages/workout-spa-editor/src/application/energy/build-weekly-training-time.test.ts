import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../types/calendar-record";
import { buildWeeklyTrainingTime } from "./build-weekly-training-time";

const PROFILE_ID = "p1";
const SEC_30_MIN = 1800;
const SEC_60_MIN = 3600;
const MIN_30 = 30;
const MIN_60 = 60;

const timedWorkout = (seconds: number): Workout => ({
  sport: "training",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds },
      targetType: "open",
      target: { type: "open" },
      intensity: "active",
    },
  ],
});

const record = (date: string, seconds: number): WorkoutRecord =>
  ({
    id: `wk-${date}`,
    profileId: PROFILE_ID,
    date,
    sport: "training",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "scheduled",
    raw: null,
    krd: createWorkoutKRD(timedWorkout(seconds)),
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

describe("buildWeeklyTrainingTime", () => {
  it("should sum same-week workouts into one Monday-anchored point", () => {
    // Arrange
    // 2026-06-16 (Tue) and 2026-06-18 (Thu) share the week of Mon 2026-06-15.
    const records = [
      record("2026-06-16", SEC_30_MIN),
      record("2026-06-18", SEC_30_MIN),
    ];

    // Act
    const result = buildWeeklyTrainingTime(records);

    // Assert
    expect(result).toEqual([{ date: "2026-06-15", minutes: MIN_60 }]);
  });

  it("should split workouts in different weeks into separate points", () => {
    // Arrange
    const records = [
      record("2026-06-16", SEC_60_MIN),
      record("2026-06-23", SEC_30_MIN),
    ];

    // Act
    const result = buildWeeklyTrainingTime(records);

    // Assert
    expect(result).toEqual([
      { date: "2026-06-15", minutes: MIN_60 },
      { date: "2026-06-22", minutes: MIN_30 },
    ]);
  });

  it("should return an empty list when no records are given", () => {
    // Arrange
    const records: WorkoutRecord[] = [];

    // Act
    const result = buildWeeklyTrainingTime(records);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip records that carry no structured workout", () => {
    // Arrange
    const noKrd = {
      ...record("2026-06-16", SEC_30_MIN),
      krd: null,
    } as WorkoutRecord;

    // Act
    const result = buildWeeklyTrainingTime([noKrd]);

    // Assert
    expect(result).toEqual([]);
  });
});
