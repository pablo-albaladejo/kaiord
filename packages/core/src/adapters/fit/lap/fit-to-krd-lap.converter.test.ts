import { describe, expect, it } from "vitest";
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
    expect(result.totalElapsedTime).toBe(600);
    expect(result.totalTimerTime).toBe(580);
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
    expect(result.avgHeartRate).toBe(145);
    expect(result.maxHeartRate).toBe(165);
    expect(result.avgCadence).toBe(90);
    expect(result.maxCadence).toBe(100);
    expect(result.avgPower).toBe(220);
    expect(result.maxPower).toBe(350);
    expect(result.normalizedPower).toBe(230);
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
    expect(result.avgSpeed).toBe(5.5);
    expect(result.maxSpeed).toBe(7.5);
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
    expect(result.avgSpeed).toBe(5.0);
    expect(result.maxSpeed).toBe(7.0);
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
    expect(result.totalAscent).toBe(150);
    expect(result.totalDescent).toBe(80);
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
    expect(result.totalCalories).toBe(250);
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
    const triggers = [
      "positionStart",
      "positionLap",
      "positionWaypoint",
      "positionMarked",
    ];

    for (const trigger of triggers) {
      const fitLap = {
        timestamp: 1704067800,
        startTime: 1704067200,
        totalElapsedTime: 600000,
        totalTimerTime: 580000,
        lapTrigger: trigger,
      };

      // Act
      const result = convertFitToKrdLap(fitLap);

      // Assert
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
    expect(result.numLengths).toBe(4);
    expect(result.swimStroke).toBe("2");
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
    expect(result.workoutStepIndex).toBe(3);
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
    const invalidLap = {
      timestamp: 1704067800,
      // Missing required fields
    };

    // Act & Assert
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
});
