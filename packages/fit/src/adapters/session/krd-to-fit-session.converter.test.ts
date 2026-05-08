import { describe, expect, it } from "vitest";

import {
  FIT_SESSION_AVG_HR,
  FIT_SESSION_INTENSITY_FACTOR,
  FIT_SESSION_MAX_HR,
  FIT_SESSION_MAX_POWER,
  FIT_SESSION_NORMALIZED_POWER,
  FIT_SESSION_ROUND_TRIP_TOLERANCE_MS,
  FIT_SESSION_TIMESTAMP_SEC,
  FIT_SESSION_TOTAL_DESCENT,
  FIT_SESSION_TOTAL_ELAPSED_MS,
  FIT_SESSION_TOTAL_TIMER_MS,
  FIT_SESSION_TSS,
} from "../../test-utils/constants";
import { convertFitToKrdSession } from "./fit-to-krd-session.converter";
import { convertKrdToFitSession } from "./krd-to-fit-session.converter";

describe("convertKrdToFitSession", () => {
  it("should convert KRD session with required fields", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      sport: "cycling",
    };

    // Act
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.startTime).toBe(FIT_SESSION_TIMESTAMP_SEC);
    expect(result.totalElapsedTime).toBe(FIT_SESSION_TOTAL_ELAPSED_MS);
    expect(result.totalTimerTime).toBe(FIT_SESSION_TOTAL_ELAPSED_MS);
  });

  it("should convert KRD session with timer time", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      totalTimerTime: 3500,
      sport: "cycling",
    };

    // Act
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.totalTimerTime).toBe(FIT_SESSION_TOTAL_TIMER_MS);
  });

  it("should convert KRD session with performance metrics", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
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
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.avgHeartRate).toBe(FIT_SESSION_AVG_HR);
    expect(result.maxHeartRate).toBe(FIT_SESSION_MAX_HR);
    expect(result.avgPower).toBe(200);
    expect(result.maxPower).toBe(FIT_SESSION_MAX_POWER);
    expect(result.normalizedPower).toBe(FIT_SESSION_NORMALIZED_POWER);
    expect(result.trainingStressScore).toBe(FIT_SESSION_TSS);
    expect(result.intensityFactor).toBe(FIT_SESSION_INTENSITY_FACTOR);
  });

  it("should convert elevation data", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      sport: "cycling",
      totalAscent: 500,
      totalDescent: 450,
    };

    // Act
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.totalAscent).toBe(500);
    expect(result.totalDescent).toBe(FIT_SESSION_TOTAL_DESCENT);
  });

  it("should throw error for invalid KRD session", () => {
    // Arrange
    const invalidSession = {
      startTime: "invalid-date",
    };

    // Act
    const act = () => convertKrdToFitSession(invalidSession);

    // Assert
    expect(act).toThrow();
  });

  it("should preserve zero totalTimerTime", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      totalTimerTime: 0,
      sport: "cycling",
    };

    // Act
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.totalTimerTime).toBe(0);
  });

  it("should map sport and subSport", () => {
    // Arrange
    const krdSession = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      sport: "cycling",
      subSport: "indoor_cycling",
    };

    // Act
    const result = convertKrdToFitSession(krdSession);

    // Assert
    expect(result.sport).toBe("cycling");
    expect(result.subSport).toBe("indoorCycling");
  });
});

describe("round-trip conversion", () => {
  it("should preserve data through KRD -> FIT -> KRD with tolerances", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      totalTimerTime: 3500,
      sport: "cycling",
      subSport: "indoor_cycling",
      avgHeartRate: 145,
      maxHeartRate: 175,
      avgPower: 200,
      maxPower: 350,
      totalAscent: 500,
      totalDescent: 450,
    };
    const fitResult = convertKrdToFitSession(originalKrd);
    const roundTrippedKrd = convertFitToKrdSession(fitResult as never);
    const originalTime = new Date(originalKrd.startTime).getTime();

    // Act
    const roundTrippedTime = new Date(roundTrippedKrd.startTime).getTime();

    // Assert
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
      FIT_SESSION_ROUND_TRIP_TOLERANCE_MS
    );
    expect(roundTrippedKrd.totalElapsedTime).toBeCloseTo(
      originalKrd.totalElapsedTime,
      0
    );
    expect(roundTrippedKrd.totalTimerTime).toBeCloseTo(
      originalKrd.totalTimerTime,
      0
    );
    expect(roundTrippedKrd.avgHeartRate).toBe(originalKrd.avgHeartRate);
    expect(roundTrippedKrd.maxHeartRate).toBe(originalKrd.maxHeartRate);
    expect(roundTrippedKrd.avgPower).toBe(originalKrd.avgPower);
    expect(roundTrippedKrd.maxPower).toBe(originalKrd.maxPower);
    expect(roundTrippedKrd.sport).toBe(originalKrd.sport);
    expect(roundTrippedKrd.subSport).toBe(originalKrd.subSport);
    expect(roundTrippedKrd.totalAscent).toBe(originalKrd.totalAscent);
    expect(roundTrippedKrd.totalDescent).toBe(originalKrd.totalDescent);
  });

  it("should preserve zero totalTimerTime through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      totalTimerTime: 0,
      sport: "cycling",
    };
    const fitResult = convertKrdToFitSession(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdSession(fitResult as never);

    // Assert
    expect(roundTrippedKrd.totalTimerTime).toBe(0);
  });
});
