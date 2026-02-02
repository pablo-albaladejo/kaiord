import { describe, expect, it } from "vitest";
import { degreesToSemicircles } from "../shared/coordinate.converter";
import {
  convertFitToKrdRecord,
  convertFitToKrdRecords,
} from "./fit-to-krd-record.converter";

describe("convertFitToKrdRecord", () => {
  it("should convert FIT record with timestamp only", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.timestamp).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should convert FIT record with GPS coordinates", () => {
    // Arrange
    const barcelonaLat = 41.3851;
    const barcelonaLon = 2.1734;
    const fitRecord = {
      timestamp: 1704067200,
      positionLat: degreesToSemicircles(barcelonaLat),
      positionLong: degreesToSemicircles(barcelonaLon),
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.position).toBeDefined();
    expect(result.position?.lat).toBeCloseTo(barcelonaLat, 5);
    expect(result.position?.lon).toBeCloseTo(barcelonaLon, 5);
  });

  it("should prefer enhanced altitude over regular", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      altitude: 100,
      enhancedAltitude: 105.5,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.altitude).toBe(105.5);
  });

  it("should prefer enhanced speed over regular", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      speed: 3.0,
      enhancedSpeed: 3.5,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.speed).toBe(3.5);
  });

  it("should convert all metric fields", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      heartRate: 145,
      cadence: 90,
      power: 250,
      distance: 5000,
      temperature: 22,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.heartRate).toBe(145);
    expect(result.cadence).toBe(90);
    expect(result.power).toBe(250);
    expect(result.distance).toBe(5000);
    expect(result.temperature).toBe(22);
  });

  it("should combine cadence with fractional cadence", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      cadence: 90,
      fractionalCadence: 0.5,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.cadence).toBe(90.5);
  });

  it("should convert running dynamics", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      verticalOscillation: 8.5,
      stanceTime: 250,
      stepLength: 1.2,
    };

    // Act
    const result = convertFitToKrdRecord(fitRecord);

    // Assert
    expect(result.verticalOscillation).toBe(8.5);
    expect(result.stanceTime).toBe(250);
    expect(result.stepLength).toBe(1.2);
  });

  it("should throw error for out-of-range coordinates", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      positionLat: degreesToSemicircles(91), // Invalid: > 90
      positionLong: degreesToSemicircles(0),
    };

    // Act & Assert
    expect(() => convertFitToKrdRecord(fitRecord)).toThrow(
      "Invalid coordinates"
    );
  });

  it("should throw error for NaN coordinates", () => {
    // Arrange
    const fitRecord = {
      timestamp: 1704067200,
      positionLat: NaN,
      positionLong: 0,
    };

    // Act & Assert - Zod catches NaN at parse time
    expect(() => convertFitToKrdRecord(fitRecord)).toThrow();
  });
});

describe("convertFitToKrdRecords", () => {
  it("should batch convert multiple records", () => {
    // Arrange
    const fitRecords = [
      { timestamp: 1704067200 },
      { timestamp: 1704067201 },
      { timestamp: 1704067202 },
    ];

    // Act
    const results = convertFitToKrdRecords(fitRecords);

    // Assert
    expect(results).toHaveLength(3);
    expect(results[0].timestamp).toBe("2024-01-01T00:00:00.000Z");
    expect(results[1].timestamp).toBe("2024-01-01T00:00:01.000Z");
    expect(results[2].timestamp).toBe("2024-01-01T00:00:02.000Z");
  });
});

describe("performance", () => {
  it("should process 10000 records in under 100ms", () => {
    // Arrange
    const fitRecords = Array.from({ length: 10000 }, (_, i) => ({
      timestamp: 1704067200 + i,
      heartRate: 145,
      cadence: 90,
      power: 250,
    }));

    // Act
    const start = performance.now();
    const results = convertFitToKrdRecords(fitRecords);
    const duration = performance.now() - start;

    // Assert
    expect(results).toHaveLength(10000);
    expect(duration).toBeLessThan(100);
  });
});
