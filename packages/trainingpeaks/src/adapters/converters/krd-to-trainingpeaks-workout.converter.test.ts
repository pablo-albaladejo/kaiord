import type { KRD, Logger, Workout } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { krdToTrainingPeaksWorkout } from "./krd-to-trainingpeaks-workout.converter";
import { ASSUMED_OPEN_STEP_SECONDS } from "./trainingpeaks-workout-steps";
import {
  CAPTURE_FTP_WATTS,
  CAPTURED_POLYLINE,
  CAPTURED_TOTAL_TIME_PLANNED_HOURS,
  CAPTURED_WORKOUT,
} from "./trainingpeaks-workout.test-fixtures";

const ATHLETE_ID = 3120341;
const WORKOUT_DAY = "2026-09-07";
const WORK_SECONDS = 180;
const RECOVER_SECONDS = 120;
const WARM_UP_SECONDS = 600;
const REPEAT_COUNT = 4;
const PROBE_WATTS = 250;
const WARM_UP_PERCENT_FTP = 55;
const WORK_PERCENT_FTP = 105;
const RECOVER_PERCENT_FTP = 50;
/** Digits compared on `totalTimePlanned`; the capture carries full precision. */
const HOURS_PRECISION = 12;

const asKrd = (workout: Workout): KRD =>
  ({
    version: "2.0",
    type: "structured_workout",
    metadata: { created: "2026-09-07T06:00:00Z", sport: workout.sport },
    extensions: { structured_workout: workout },
  }) as KRD;

const percentFtpStep = (
  stepIndex: number,
  name: string,
  seconds: number,
  percent: number,
  intensity: "warmup" | "active" | "rest"
) => ({
  stepIndex,
  name,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "percent_ftp" as const, value: percent },
  },
  intensity,
});

const spyLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("krdToTrainingPeaksWorkout", () => {
  it("should serialise structure as a JSON string, not an object", () => {
    // Arrange
    const krd = asKrd(CAPTURED_WORKOUT);

    // Act
    const payload = krdToTrainingPeaksWorkout(krd, {
      athleteId: ATHLETE_ID,
      workoutDay: WORKOUT_DAY,
      thresholds: { ftpWatts: CAPTURE_FTP_WATTS },
    });

    // Assert
    expect(typeof payload.structure).toBe("string");
    expect(JSON.parse(payload.structure).primaryIntensityMetric).toBe(
      "percentOfFtp"
    );
  });

  it("should reproduce the polyline captured from TrainingPeaks", () => {
    // Arrange
    const krd = asKrd(CAPTURED_WORKOUT);

    // Act
    const payload = krdToTrainingPeaksWorkout(krd, {
      athleteId: ATHLETE_ID,
      workoutDay: WORKOUT_DAY,
      thresholds: { ftpWatts: CAPTURE_FTP_WATTS },
    });

    // Assert
    expect(JSON.parse(payload.structure).polyline).toEqual(
      CAPTURED_POLYLINE.map((point) => [...point])
    );
    expect(payload.totalTimePlanned).toBeCloseTo(
      CAPTURED_TOTAL_TIME_PLANNED_HOURS,
      HOURS_PRECISION
    );
  });

  it("should carry the repeat count in a block's length.value", () => {
    // Arrange
    const krd = asKrd({
      name: "Intervals",
      sport: "cycling",
      steps: [
        percentFtpStep(
          0,
          "Warm up",
          WARM_UP_SECONDS,
          WARM_UP_PERCENT_FTP,
          "warmup"
        ),
        {
          repeatCount: REPEAT_COUNT,
          steps: [
            percentFtpStep(1, "Work", WORK_SECONDS, WORK_PERCENT_FTP, "active"),
            percentFtpStep(
              2,
              "Recover",
              RECOVER_SECONDS,
              RECOVER_PERCENT_FTP,
              "rest"
            ),
          ],
        },
      ],
    } as Workout);

    // Act
    const structure = JSON.parse(
      krdToTrainingPeaksWorkout(krd, {
        athleteId: ATHLETE_ID,
        workoutDay: WORKOUT_DAY,
      }).structure
    );

    // Assert
    expect(structure.structure.map((b: { type: string }) => b.type)).toEqual([
      "step",
      "repetition",
    ]);
    expect(structure.structure[1].length).toEqual({
      value: REPEAT_COUNT,
      unit: "repetition",
    });
    expect(structure.structure[1].end).toBe(
      WARM_UP_SECONDS + (WORK_SECONDS + RECOVER_SECONDS) * REPEAT_COUNT
    );
  });

  it("should warn when a target has no threshold to become a percentage", () => {
    // Arrange
    const logger = spyLogger();
    const krd = asKrd({
      name: "No FTP",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          name: "Effort",
          durationType: "time",
          duration: { type: "time", seconds: WORK_SECONDS },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: PROBE_WATTS },
          },
          intensity: "active",
        },
      ],
    } as Workout);

    // Act
    krdToTrainingPeaksWorkout(krd, {
      athleteId: ATHLETE_ID,
      workoutDay: WORKOUT_DAY,
      logger,
    });

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Lossy conversion:"),
      expect.objectContaining({ value: PROBE_WATTS })
    );
  });

  it("should warn and substitute a placeholder for a non-time duration", () => {
    // Arrange
    const logger = spyLogger();
    const krd = asKrd({
      name: "Open",
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          name: "Open",
          durationType: "open",
          duration: { type: "open" },
          targetType: "pace",
          target: { type: "pace", value: { unit: "zone", value: 2 } },
          intensity: "active",
        },
      ],
    } as Workout);

    // Act
    const structure = JSON.parse(
      krdToTrainingPeaksWorkout(krd, {
        athleteId: ATHLETE_ID,
        workoutDay: WORKOUT_DAY,
        logger,
      }).structure
    );

    // Assert
    expect(structure.structure[0].steps[0].openDuration).toBe(true);
    expect(structure.structure[0].steps[0].length.value).toBe(
      ASSUMED_OPEN_STEP_SECONDS
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Lossy conversion:"),
      expect.objectContaining({ durationType: "open" })
    );
  });
});
