import { describe, expect, it } from "vitest";
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
    expect(result.totalElapsedTime).toBe(3600);
    expect(result.totalTimerTime).toBe(3500);
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
    expect(result.avgHeartRate).toBe(145);
    expect(result.maxHeartRate).toBe(175);
    expect(result.avgPower).toBe(200);
    expect(result.maxPower).toBe(350);
    expect(result.normalizedPower).toBe(210);
    expect(result.trainingStressScore).toBe(75.5);
    expect(result.intensityFactor).toBe(0.85);
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
    expect(result.avgSpeed).toBe(3.5);
    expect(result.maxSpeed).toBe(4.5);
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
    expect(result.avgSpeed).toBe(3.0);
    expect(result.maxSpeed).toBe(4.0);
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
    expect(result.totalDescent).toBe(450);
  });

  it("should throw error for invalid FIT session", () => {
    // Arrange
    const invalidSession = {
      timestamp: "invalid",
    };

    // Act & Assert
    expect(() => convertFitToKrdSession(invalidSession)).toThrow();
  });
});
