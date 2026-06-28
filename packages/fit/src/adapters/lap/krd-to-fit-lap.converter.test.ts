import { describe, expect, it } from "vitest";

import {
  NINE_MIN_FORTY_SEC_MS,
  SAMPLE_CADENCE,
  SAMPLE_DISTANCE_M,
  SAMPLE_ELEVATION,
  SAMPLE_HR,
  SAMPLE_POWER,
  SAMPLE_SPEED,
  SAMPLE_TIMESTAMP_2024_01_01_PLUS_10MIN_SEC,
  SAMPLE_TIMESTAMP_2024_01_01_SEC,
  SAMPLE_WORKOUT_STEP_INDEX,
  TEN_MIN_MS,
  TEN_MIN_SEC,
  TIME_TOLERANCE_MS,
} from "../../test-utils/constants";
import { convertFitToKrdLap } from "./fit-to-krd-lap.converter";
import {
  convertKrdToFitLap,
  convertKrdToFitLaps,
} from "./krd-to-fit-lap.converter";

describe("convertKrdToFitLap", () => {
  it("should convert KRD lap with required fields", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalTimerTime: 580,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.startTime).toBe(SAMPLE_TIMESTAMP_2024_01_01_SEC);
    expect(result.totalElapsedTime).toBe(TEN_MIN_MS);
    expect(result.totalTimerTime).toBe(NINE_MIN_FORTY_SEC_MS);
    expect(result.timestamp).toBe(
      SAMPLE_TIMESTAMP_2024_01_01_SEC + TEN_MIN_SEC
    );
  });

  it("should default totalTimerTime to totalElapsedTime when undefined", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.totalTimerTime).toBe(TEN_MIN_MS);
  });

  it("should preserve zero totalTimerTime", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalTimerTime: 0,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.totalTimerTime).toBe(0);
  });

  it("should convert performance metrics", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      avgHeartRate: 145,
      maxHeartRate: 165,
      avgCadence: 90,
      maxCadence: 100,
      avgPower: 220,
      maxPower: 350,
      normalizedPower: 230,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.avgHeartRate).toBe(SAMPLE_HR.AVG);
    expect(result.maxHeartRate).toBe(SAMPLE_HR.MAX);
    expect(result.avgCadence).toBe(SAMPLE_CADENCE.AVG);
    expect(result.maxCadence).toBe(SAMPLE_CADENCE.MAX);
    expect(result.avgPower).toBe(SAMPLE_POWER.AVG);
    expect(result.maxPower).toBe(SAMPLE_POWER.MAX);
    expect(result.normalizedPower).toBe(SAMPLE_POWER.NORMALIZED);
  });

  it("should convert speed and elevation", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      avgSpeed: 5.5,
      maxSpeed: 7.5,
      totalAscent: 150,
      totalDescent: 80,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.avgSpeed).toBe(SAMPLE_SPEED.AVG_ENHANCED);
    expect(result.maxSpeed).toBe(SAMPLE_SPEED.MAX_ENHANCED);
    expect(result.totalAscent).toBe(SAMPLE_ELEVATION.ASCENT_M);
    expect(result.totalDescent).toBe(SAMPLE_ELEVATION.DESCENT_M);
  });

  it("should convert trigger to FIT format", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      trigger: "session_end" as const,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.lapTrigger).toBe("sessionEnd");
  });

  it("should convert position trigger to positionLap", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      trigger: "position" as const,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.lapTrigger).toBe("positionLap");
  });

  it("should convert workout step index", () => {
    // Arrange
    const krdLap = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      workoutStepIndex: 3,
    };

    // Act
    const result = convertKrdToFitLap(krdLap);

    // Assert
    expect(result.wktStepIndex).toBe(SAMPLE_WORKOUT_STEP_INDEX);
  });

  it("should throw error for invalid KRD lap", () => {
    // Arrange

    // Act
    const invalidLap = {
      startTime: "invalid-date",
      totalElapsedTime: 600,
    };

    // Assert
    expect(() => convertKrdToFitLap(invalidLap)).toThrow();
  });
});

describe("convertKrdToFitLaps", () => {
  it("should batch convert multiple laps", () => {
    // Arrange
    const krdLaps = [
      { startTime: "2024-01-01T00:00:00.000Z", totalElapsedTime: 600 },
      { startTime: "2024-01-01T00:10:00.000Z", totalElapsedTime: 600 },
    ];

    // Act
    const results = convertKrdToFitLaps(krdLaps);

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0].startTime).toBe(SAMPLE_TIMESTAMP_2024_01_01_SEC);
    expect(results[1].startTime).toBe(
      SAMPLE_TIMESTAMP_2024_01_01_PLUS_10MIN_SEC
    );
  });

  it("should return empty array for empty input", () => {
    // Arrange
    const krdLaps: Record<string, unknown>[] = [];

    // Act
    const results = convertKrdToFitLaps(krdLaps);

    // Assert
    expect(results).toEqual([]);
  });

  it("should convert lap with distance", () => {
    // Arrange
    const krdLaps = [
      {
        startTime: "2024-01-01T00:00:00.000Z",
        totalElapsedTime: 600,
        totalDistance: 5000,
      },
    ];

    // Act
    const results = convertKrdToFitLaps(krdLaps);

    // Assert
    expect(results[0].totalDistance).toBe(SAMPLE_DISTANCE_M);
  });
});

describe("round-trip conversion", () => {
  it("should preserve timing through KRD -> FIT -> KRD with tolerance", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalTimerTime: 580,
    };
    const fitResult = convertKrdToFitLap(originalKrd);
    const roundTrippedKrd = convertFitToKrdLap(fitResult);
    const originalTime = new Date(originalKrd.startTime).getTime();

    // Act
    const roundTrippedTime = new Date(roundTrippedKrd.startTime).getTime();

    // Assert
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
      TIME_TOLERANCE_MS
    );
    expect(
      Math.abs(roundTrippedKrd.totalElapsedTime - originalKrd.totalElapsedTime)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(roundTrippedKrd.totalTimerTime! - originalKrd.totalTimerTime)
    ).toBeLessThanOrEqual(1);
  });

  it("should preserve zero totalTimerTime through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalTimerTime: 0,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.totalTimerTime).toBe(0);
  });

  it("should preserve metrics through KRD -> FIT -> KRD with tolerances", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      avgHeartRate: 145,
      maxHeartRate: 165,
      avgCadence: 90,
      avgPower: 220,
      maxPower: 350,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.avgHeartRate).toBe(originalKrd.avgHeartRate);
    expect(roundTrippedKrd.maxHeartRate).toBe(originalKrd.maxHeartRate);
    expect(roundTrippedKrd.avgPower).toBe(originalKrd.avgPower);
    expect(roundTrippedKrd.maxPower).toBe(originalKrd.maxPower);
    expect(roundTrippedKrd.avgCadence).toBe(originalKrd.avgCadence);
  });

  it.each([
    "manual",
    "time",
    "distance",
    "session_end",
    "fitness_equipment",
    "position",
  ] as const)("should preserve %s trigger through round-trip", (trigger) => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      trigger,
    };

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.trigger).toBe(trigger);
  });

  it("should preserve speed through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      avgSpeed: 5.5,
      maxSpeed: 7.5,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.avgSpeed).toBe(originalKrd.avgSpeed);
    expect(roundTrippedKrd.maxSpeed).toBe(originalKrd.maxSpeed);
  });

  it("should preserve elevation through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalAscent: 150,
      totalDescent: 80,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.totalAscent).toBe(originalKrd.totalAscent);
    expect(roundTrippedKrd.totalDescent).toBe(originalKrd.totalDescent);
  });

  it("should preserve distance through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalDistance: 5000,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.totalDistance).toBe(originalKrd.totalDistance);
  });

  it("should preserve calories through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      totalCalories: 250,
    };
    const fitResult = convertKrdToFitLap(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.totalCalories).toBe(originalKrd.totalCalories);
  });
});
