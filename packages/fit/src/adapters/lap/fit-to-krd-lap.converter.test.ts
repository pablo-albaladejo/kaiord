import { describe, expect, it } from "vitest";

import {
  NINE_MIN_FORTY_SEC,
  SAMPLE_CADENCE,
  SAMPLE_CALORIES,
  SAMPLE_DISTANCE_M,
  SAMPLE_ELEVATION,
  SAMPLE_HR,
  SAMPLE_NUM_LENGTHS,
  SAMPLE_POWER,
  SAMPLE_SPEED,
  SAMPLE_WORKOUT_STEP_INDEX,
  TEN_MIN_SEC,
} from "../../test-utils/constants";
import {
  convertFitToKrdLap,
  convertFitToKrdLaps,
} from "./fit-to-krd-lap.converter";

describe("convertFitToKrdLap", () => {
  it("should convert FIT lap with required fields", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.startTime).toBe("2024-01-01T00:00:00.000Z");
    expect(result.totalElapsedTime).toBe(TEN_MIN_SEC);
    expect(result.totalTimerTime).toBe(NINE_MIN_FORTY_SEC);
  });

  it("should convert lap with performance metrics (HR, power, cadence)", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      avgHeartRate: 145,
      maxHeartRate: 165,
      avgCadence: 90,
      maxCadence: 100,
      avgPower: 220,
      maxPower: 350,
      normalizedPower: 230,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.avgHeartRate).toBe(SAMPLE_HR.AVG);
    expect(result.maxHeartRate).toBe(SAMPLE_HR.MAX);
    expect(result.avgCadence).toBe(SAMPLE_CADENCE.AVG);
    expect(result.maxCadence).toBe(SAMPLE_CADENCE.MAX);
    expect(result.avgPower).toBe(SAMPLE_POWER.AVG);
    expect(result.maxPower).toBe(SAMPLE_POWER.MAX);
    expect(result.normalizedPower).toBe(SAMPLE_POWER.NORMALIZED);
  });

  it("should prefer enhanced speed over regular", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      avgSpeed: 5.0,
      maxSpeed: 7.0,
      enhancedAvgSpeed: 5.5,
      enhancedMaxSpeed: 7.5,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.avgSpeed).toBe(SAMPLE_SPEED.AVG_ENHANCED);
    expect(result.maxSpeed).toBe(SAMPLE_SPEED.MAX_ENHANCED);
  });

  it("should use regular speed when enhanced not available", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      avgSpeed: 5.0,
      maxSpeed: 7.0,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.avgSpeed).toBe(SAMPLE_SPEED.AVG_BASE);
    expect(result.maxSpeed).toBe(SAMPLE_SPEED.MAX_BASE);
  });

  it("should convert lap with elevation data", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      totalAscent: 150,
      totalDescent: 80,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.totalAscent).toBe(SAMPLE_ELEVATION.ASCENT_M);
    expect(result.totalDescent).toBe(SAMPLE_ELEVATION.DESCENT_M);
  });

  it("should convert lap with calories", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      totalCalories: 250,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.totalCalories).toBe(SAMPLE_CALORIES);
  });

  it("should convert lap with manual trigger", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      lapTrigger: "manual",
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.trigger).toBe("manual");
  });

  it("should convert position triggers to position", () => {
    // Arrange

    // Act
    const triggers = [
      "positionStart",
      "positionLap",
      "positionWaypoint",
      "positionMarked",
    ];

    // Assert
    for (const trigger of triggers) {
      const fitLap = {
        timestamp: 1704067800,
        startTime: 1704067200,
        totalElapsedTime: 600000,
        totalTimerTime: 580000,
        lapTrigger: trigger,
      };

      const result = convertFitToKrdLap(fitLap);

      expect(result.trigger).toBe("position");
    }
  });

  it("should convert sessionEnd trigger to session_end", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      lapTrigger: "sessionEnd",
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.trigger).toBe("session_end");
  });

  it("should convert lap with swimming fields", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 60000,
      totalTimerTime: 55000,
      numLengths: 4,
      swimStroke: 2,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.numLengths).toBe(SAMPLE_NUM_LENGTHS);
    expect(result.swimStroke).toBe("breaststroke");
  });

  it("should convert lap with workout step index", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      wktStepIndex: 3,
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.workoutStepIndex).toBe(SAMPLE_WORKOUT_STEP_INDEX);
  });

  it("should convert lap with sport and subSport", () => {
    // Arrange
    const fitLap = {
      timestamp: 1704067800,
      startTime: 1704067200,
      totalElapsedTime: 600000,
      totalTimerTime: 580000,
      sport: "cycling",
      subSport: "indoorCycling",
    };

    // Act
    const result = convertFitToKrdLap(fitLap);

    // Assert
    expect(result.sport).toBe("cycling");
    expect(result.subSport).toBe("indoor_cycling");
  });

  it("should throw error for invalid data", () => {
    // Arrange

    // Act
    const invalidLap = {
      timestamp: 1704067800,
      // Missing required fields
    };

    // Assert
    expect(() => convertFitToKrdLap(invalidLap)).toThrow();
  });
});

describe("convertFitToKrdLaps", () => {
  it("should batch convert multiple laps", () => {
    // Arrange
    const fitLaps = [
      {
        timestamp: 1704067800,
        startTime: 1704067200,
        totalElapsedTime: 600000,
        totalTimerTime: 580000,
      },
      {
        timestamp: 1704068400,
        startTime: 1704067800,
        totalElapsedTime: 600000,
        totalTimerTime: 590000,
      },
    ];

    // Act
    const results = convertFitToKrdLaps(fitLaps);

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0].startTime).toBe("2024-01-01T00:00:00.000Z");
    expect(results[1].startTime).toBe("2024-01-01T00:10:00.000Z");
  });

  it("should return empty array for empty input", () => {
    // Arrange
    const fitLaps: Record<string, unknown>[] = [];

    // Act
    const results = convertFitToKrdLaps(fitLaps);

    // Assert
    expect(results).toEqual([]);
  });

  it("should convert lap with distance", () => {
    // Arrange
    const fitLaps = [
      {
        timestamp: 1704067800,
        startTime: 1704067200,
        totalElapsedTime: 600000,
        totalTimerTime: 580000,
        totalDistance: 5000,
      },
    ];

    // Act
    const results = convertFitToKrdLaps(fitLaps);

    // Assert
    expect(results[0].totalDistance).toBe(SAMPLE_DISTANCE_M);
  });
});
