import { describe, expect, it } from "vitest";
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
    expect(result.startTime).toBe(1704067200);
    expect(result.totalElapsedTime).toBe(3600000);
    // FIT requires totalTimerTime, defaults to elapsed when not provided
    expect(result.totalTimerTime).toBe(3600000);
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
    expect(result.totalTimerTime).toBe(3500000);
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
    expect(result.avgHeartRate).toBe(145);
    expect(result.maxHeartRate).toBe(175);
    expect(result.avgPower).toBe(200);
    expect(result.maxPower).toBe(350);
    expect(result.normalizedPower).toBe(210);
    expect(result.trainingStressScore).toBe(75.5);
    expect(result.intensityFactor).toBe(0.85);
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
    expect(result.totalDescent).toBe(450);
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
    // Arrange - start with KRD
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

    // Act - convert to FIT and back to KRD
    const fitResult = convertKrdToFitSession(originalKrd);
    const roundTrippedKrd = convertFitToKrdSession(fitResult as never);

    // Assert - timestamp within 1 second tolerance
    const originalTime = new Date(originalKrd.startTime).getTime();
    const roundTrippedTime = new Date(roundTrippedKrd.startTime).getTime();
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(1000);

    // Assert - time values preserved (note: ms precision may differ)
    expect(roundTrippedKrd.totalElapsedTime).toBeCloseTo(
      originalKrd.totalElapsedTime,
      0
    );
    expect(roundTrippedKrd.totalTimerTime).toBeCloseTo(
      originalKrd.totalTimerTime,
      0
    );

    // Assert - heart rate within 1 bpm
    expect(roundTrippedKrd.avgHeartRate).toBe(originalKrd.avgHeartRate);
    expect(roundTrippedKrd.maxHeartRate).toBe(originalKrd.maxHeartRate);

    // Assert - power within 1W
    expect(roundTrippedKrd.avgPower).toBe(originalKrd.avgPower);
    expect(roundTrippedKrd.maxPower).toBe(originalKrd.maxPower);

    // Assert - sport/subSport preserved
    expect(roundTrippedKrd.sport).toBe(originalKrd.sport);
    expect(roundTrippedKrd.subSport).toBe(originalKrd.subSport);

    // Assert - elevation data preserved
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

    // Act
    const fitResult = convertKrdToFitSession(originalKrd);
    const roundTrippedKrd = convertFitToKrdSession(fitResult as never);

    // Assert
    expect(roundTrippedKrd.totalTimerTime).toBe(0);
  });
});
