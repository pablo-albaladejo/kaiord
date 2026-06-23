import { createWorkoutKRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { measuredDurationSec } from "./day-duration";

const FIRST_SECONDS = 600;
const SECOND_SECONDS = 900;
const TOTAL_SECONDS = 1500;
const FTP_PERCENT = 60;

const krdWorkout = (seconds: number): WorkoutRecord =>
  ({
    id: "w-krd",
    date: "2026-04-29",
    sport: "cycling",
    source: "manual",
    state: "structured",
    raw: null,
    krd: createWorkoutKRD({
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: FTP_PERCENT },
          },
        },
      ],
    }),
  }) as WorkoutRecord;

const rawWorkout = (): WorkoutRecord =>
  ({
    ...krdWorkout(FIRST_SECONDS),
    id: "w-raw",
    state: "raw",
    krd: null,
  }) as WorkoutRecord;

describe("measuredDurationSec", () => {
  it("should return null when no workout carries a KRD", () => {
    // Arrange
    const workouts = [rawWorkout()];

    // Act
    const duration = measuredDurationSec(workouts);

    // Assert
    expect(duration).toBeNull();
  });

  it("should return the measured duration of a KRD workout", () => {
    // Arrange
    const workouts = [krdWorkout(FIRST_SECONDS)];

    // Act
    const duration = measuredDurationSec(workouts);

    // Assert
    expect(duration).toBe(FIRST_SECONDS);
  });

  it("should sum durations across multiple KRD workouts", () => {
    // Arrange
    const workouts = [krdWorkout(FIRST_SECONDS), krdWorkout(SECOND_SECONDS)];

    // Act
    const duration = measuredDurationSec(workouts);

    // Assert
    expect(duration).toBe(TOTAL_SECONDS);
  });

  it("should return null for an empty list", () => {
    // Arrange
    const workouts: WorkoutRecord[] = [];

    // Act
    const duration = measuredDurationSec(workouts);

    // Assert
    expect(duration).toBeNull();
  });
});
