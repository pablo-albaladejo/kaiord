import { describe, expect, it } from "vitest";
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
    expect(result.totalTimerTime).toBeUndefined();
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

    // Act & Assert
    expect(() => convertKrdToFitSession(invalidSession)).toThrow();
  });
});

describe("round-trip conversion", () => {
  it("should preserve data through FIT → KRD → FIT", () => {
    // Arrange - start with KRD
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 3600,
      totalTimerTime: 3500,
      sport: "cycling",
      avgHeartRate: 145,
      maxHeartRate: 175,
      avgPower: 200,
      maxPower: 350,
    };

    // Act - convert to FIT and back
    const fitResult = convertKrdToFitSession(originalKrd);

    // Assert - values preserved within tolerance
    expect(fitResult.totalElapsedTime).toBe(3600000);
    expect(fitResult.totalTimerTime).toBe(3500000);
    expect(fitResult.avgHeartRate).toBe(145);
    expect(fitResult.maxHeartRate).toBe(175);
    expect(fitResult.avgPower).toBe(200);
    expect(fitResult.maxPower).toBe(350);
  });
});
