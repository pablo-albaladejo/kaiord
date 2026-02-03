import { describe, expect, it } from "vitest";
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
    expect(result.startTime).toBe(1704067200);
    expect(result.totalElapsedTime).toBe(600000);
    expect(result.totalTimerTime).toBe(580000);
    expect(result.timestamp).toBe(1704067200 + 600);
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
    expect(result.totalTimerTime).toBe(600000);
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
    expect(result.avgHeartRate).toBe(145);
    expect(result.maxHeartRate).toBe(165);
    expect(result.avgCadence).toBe(90);
    expect(result.maxCadence).toBe(100);
    expect(result.avgPower).toBe(220);
    expect(result.maxPower).toBe(350);
    expect(result.normalizedPower).toBe(230);
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
    expect(result.avgSpeed).toBe(5.5);
    expect(result.maxSpeed).toBe(7.5);
    expect(result.totalAscent).toBe(150);
    expect(result.totalDescent).toBe(80);
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
    expect(result.wktStepIndex).toBe(3);
  });

  it("should throw error for invalid KRD lap", () => {
    // Arrange
    const invalidLap = {
      startTime: "invalid-date",
      totalElapsedTime: 600,
    };

    // Act & Assert
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
    expect(results[0].startTime).toBe(1704067200);
    expect(results[1].startTime).toBe(1704067800);
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

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert - time within 1 second tolerance
    const originalTime = new Date(originalKrd.startTime).getTime();
    const roundTrippedTime = new Date(roundTrippedKrd.startTime).getTime();
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(1000);

    // Assert - elapsed time within 1 second
    expect(
      Math.abs(roundTrippedKrd.totalElapsedTime - originalKrd.totalElapsedTime)
    ).toBeLessThanOrEqual(1);

    // Assert - timer time within 1 second
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

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
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

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert - heart rate within 1 bpm
    expect(roundTrippedKrd.avgHeartRate).toBe(originalKrd.avgHeartRate);
    expect(roundTrippedKrd.maxHeartRate).toBe(originalKrd.maxHeartRate);

    // Assert - power within 1W
    expect(roundTrippedKrd.avgPower).toBe(originalKrd.avgPower);
    expect(roundTrippedKrd.maxPower).toBe(originalKrd.maxPower);

    // Assert - cadence within 1 rpm
    expect(roundTrippedKrd.avgCadence).toBe(originalKrd.avgCadence);
  });

  it("should preserve trigger through round-trip (simple triggers)", () => {
    // Arrange
    const simpleTriggers = ["manual", "time", "distance"] as const;

    for (const trigger of simpleTriggers) {
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
    }
  });

  it("should preserve speed through round-trip", () => {
    // Arrange
    const originalKrd = {
      startTime: "2024-01-01T00:00:00.000Z",
      totalElapsedTime: 600,
      avgSpeed: 5.5,
      maxSpeed: 7.5,
    };

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
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

    // Act
    const fitResult = convertKrdToFitLap(originalKrd);
    const roundTrippedKrd = convertFitToKrdLap(fitResult);

    // Assert
    expect(roundTrippedKrd.totalAscent).toBe(originalKrd.totalAscent);
    expect(roundTrippedKrd.totalDescent).toBe(originalKrd.totalDescent);
  });
});
