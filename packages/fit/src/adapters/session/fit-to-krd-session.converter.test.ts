import { describe, expect, it } from "vitest";

import {
  FIT_SESSION_AVG_HR,
  FIT_SESSION_AVG_SPEED_BASE,
  FIT_SESSION_AVG_SPEED_ENHANCED,
  FIT_SESSION_INTENSITY_FACTOR,
  FIT_SESSION_MAX_HR,
  FIT_SESSION_MAX_POWER,
  FIT_SESSION_MAX_SPEED_BASE,
  FIT_SESSION_MAX_SPEED_ENHANCED,
  FIT_SESSION_NORMALIZED_POWER,
  FIT_SESSION_TOTAL_DESCENT,
  FIT_SESSION_TOTAL_ELAPSED_SEC,
  FIT_SESSION_TOTAL_TIMER_SEC,
  FIT_SESSION_TSS,
} from "../../test-utils/constants";
import { convertFitToKrdSession } from "./fit-to-krd-session.converter";

describe("convertFitToKrdSession", () => {
  it("should convert FIT session with required fields", () => {
    // Arrange
    const fitSession = {
      timestamp: 1704067200,
      startTime: 1704067200,
      totalElapsedTime: 3600000,
      totalTimerTime: 3500000,
      sport: "cycling",
      subSport: "indoorCycling",
    };

    // Act
    const result = convertFitToKrdSession(fitSession);

    // Assert
    expect(result.startTime).toBe("2024-01-01T00:00:00.000Z");
    expect(result.totalElapsedTime).toBe(FIT_SESSION_TOTAL_ELAPSED_SEC);
    expect(result.totalTimerTime).toBe(FIT_SESSION_TOTAL_TIMER_SEC);
    expect(result.sport).toBe("cycling");
    expect(result.subSport).toBe("indoor_cycling");
  });

  it("should convert FIT session with performance metrics", () => {
    // Arrange
    const fitSession = {
      timestamp: 1704067200,
      startTime: 1704067200,
      totalElapsedTime: 3600000,
      totalTimerTime: 3600000,
      sport: "cycling",
      avgHeartRate: 145,
      maxHeartRate: 175,
      avgPower: 200,
      maxPower: 350,
      normalizedPower: 210,
      trainingStressScore: 75.5,
      intensityFactor: 0.85,
    };

    // Act
    const result = convertFitToKrdSession(fitSession);

    // Assert
    expect(result.avgHeartRate).toBe(FIT_SESSION_AVG_HR);
    expect(result.maxHeartRate).toBe(FIT_SESSION_MAX_HR);
    expect(result.avgPower).toBe(200);
    expect(result.maxPower).toBe(FIT_SESSION_MAX_POWER);
    expect(result.normalizedPower).toBe(FIT_SESSION_NORMALIZED_POWER);
    expect(result.trainingStressScore).toBe(FIT_SESSION_TSS);
    expect(result.intensityFactor).toBe(FIT_SESSION_INTENSITY_FACTOR);
  });

  it("should prefer enhanced speed fields over regular speed", () => {
    // Arrange
    const fitSession = {
      timestamp: 1704067200,
      startTime: 1704067200,
      totalElapsedTime: 3600000,
      totalTimerTime: 3600000,
      sport: "running",
      avgSpeed: 3.0,
      maxSpeed: 4.0,
      enhancedAvgSpeed: 3.5,
      enhancedMaxSpeed: 4.5,
    };

    // Act
    const result = convertFitToKrdSession(fitSession);

    // Assert
    expect(result.avgSpeed).toBe(FIT_SESSION_AVG_SPEED_ENHANCED);
    expect(result.maxSpeed).toBe(FIT_SESSION_MAX_SPEED_ENHANCED);
  });

  it("should fall back to regular speed when enhanced not available", () => {
    // Arrange
    const fitSession = {
      timestamp: 1704067200,
      startTime: 1704067200,
      totalElapsedTime: 3600000,
      totalTimerTime: 3600000,
      sport: "running",
      avgSpeed: 3.0,
      maxSpeed: 4.0,
    };

    // Act
    const result = convertFitToKrdSession(fitSession);

    // Assert
    expect(result.avgSpeed).toBe(FIT_SESSION_AVG_SPEED_BASE);
    expect(result.maxSpeed).toBe(FIT_SESSION_MAX_SPEED_BASE);
  });

  it("should convert elevation data", () => {
    // Arrange
    const fitSession = {
      timestamp: 1704067200,
      startTime: 1704067200,
      totalElapsedTime: 3600000,
      totalTimerTime: 3600000,
      sport: "cycling",
      totalAscent: 500,
      totalDescent: 450,
    };

    // Act
    const result = convertFitToKrdSession(fitSession);

    // Assert
    expect(result.totalAscent).toBe(500);
    expect(result.totalDescent).toBe(FIT_SESSION_TOTAL_DESCENT);
  });

  it("should throw error for invalid FIT session", () => {
    // Arrange

    // Act
    const invalidSession = {
      timestamp: "invalid",
    };

    // Assert
    expect(() => convertFitToKrdSession(invalidSession)).toThrow();
  });
});
