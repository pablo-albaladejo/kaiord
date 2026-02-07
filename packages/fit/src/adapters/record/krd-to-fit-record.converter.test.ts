import { describe, expect, it } from "vitest";
import { semicirclesToDegrees } from "../shared/coordinate.converter";
import { convertFitToKrdRecord } from "./fit-to-krd-record.converter";
import {
  convertKrdToFitRecord,
  convertKrdToFitRecords,
} from "./krd-to-fit-record.converter";

describe("convertKrdToFitRecord", () => {
  it("should convert KRD record with timestamp only", () => {
    // Arrange
    const krdRecord = {
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    // Act
    const result = convertKrdToFitRecord(krdRecord);

    // Assert
    expect(result.timestamp).toBe(1704067200);
  });

  it("should convert KRD record with GPS coordinates", () => {
    // Arrange
    const barcelonaLat = 41.3851;
    const barcelonaLon = 2.1734;
    const krdRecord = {
      timestamp: "2024-01-01T00:00:00.000Z",
      position: {
        lat: barcelonaLat,
        lon: barcelonaLon,
      },
    };

    // Act
    const result = convertKrdToFitRecord(krdRecord);

    // Assert
    expect(result.positionLat).toBeDefined();
    expect(result.positionLong).toBeDefined();
    // Round-trip check: convert back to degrees
    expect(semicirclesToDegrees(result.positionLat!)).toBeCloseTo(
      barcelonaLat,
      5
    );
    expect(semicirclesToDegrees(result.positionLong!)).toBeCloseTo(
      barcelonaLon,
      5
    );
  });

  it("should convert all metric fields", () => {
    // Arrange
    const krdRecord = {
      timestamp: "2024-01-01T00:00:00.000Z",
      heartRate: 145,
      cadence: 90.5,
      power: 250,
      distance: 5000,
      altitude: 105.5,
      speed: 3.5,
      temperature: 22,
    };

    // Act
    const result = convertKrdToFitRecord(krdRecord);

    // Assert
    expect(result.heartRate).toBe(145);
    expect(result.cadence).toBe(90); // Floored from 90.5
    expect(result.power).toBe(250);
    expect(result.distance).toBe(5000);
    expect(result.altitude).toBe(105.5);
    expect(result.speed).toBe(3.5);
    expect(result.temperature).toBe(22);
  });

  it("should convert running dynamics", () => {
    // Arrange
    const krdRecord = {
      timestamp: "2024-01-01T00:00:00.000Z",
      verticalOscillation: 8.5,
      stanceTime: 250,
      stepLength: 1.2,
    };

    // Act
    const result = convertKrdToFitRecord(krdRecord);

    // Assert
    expect(result.verticalOscillation).toBe(8.5);
    expect(result.stanceTime).toBe(250);
    expect(result.stepLength).toBe(1.2);
  });

  it("should throw error for invalid KRD record", () => {
    // Arrange
    const invalidRecord = {
      timestamp: "invalid-date",
    };

    // Act
    const act = () => convertKrdToFitRecord(invalidRecord);

    // Assert
    expect(act).toThrow();
  });
});

describe("convertKrdToFitRecords", () => {
  it("should batch convert multiple records", () => {
    // Arrange
    const krdRecords = [
      { timestamp: "2024-01-01T00:00:00.000Z" },
      { timestamp: "2024-01-01T00:00:01.000Z" },
      { timestamp: "2024-01-01T00:00:02.000Z" },
    ];

    // Act
    const results = convertKrdToFitRecords(krdRecords);

    // Assert
    expect(results).toHaveLength(3);
    expect(results[0].timestamp).toBe(1704067200);
    expect(results[1].timestamp).toBe(1704067201);
    expect(results[2].timestamp).toBe(1704067202);
  });
});

describe("round-trip conversion", () => {
  it("should preserve coordinates through KRD -> FIT -> KRD", () => {
    // Arrange
    const cities = [
      { name: "Barcelona", lat: 41.3851, lon: 2.1734 },
      { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
      { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    ];

    cities.forEach(({ lat, lon }) => {
      const originalKrd = {
        timestamp: "2024-01-01T00:00:00.000Z",
        position: { lat, lon },
      };

      // Act - convert to FIT and back to KRD
      const fitResult = convertKrdToFitRecord(originalKrd);
      const roundTrippedKrd = convertFitToKrdRecord(fitResult);

      // Assert - verify coordinates preserved within tolerance
      expect(roundTrippedKrd.position?.lat).toBeCloseTo(lat, 5);
      expect(roundTrippedKrd.position?.lon).toBeCloseTo(lon, 5);
    });
  });

  it("should preserve metrics through KRD -> FIT -> KRD with tolerances", () => {
    // Arrange
    const originalKrd = {
      timestamp: "2024-01-01T00:00:00.000Z",
      heartRate: 145,
      cadence: 90.5,
      power: 250,
      distance: 5000,
      altitude: 105.5,
      speed: 3.5,
      temperature: 22,
    };

    // Act
    const fitResult = convertKrdToFitRecord(originalKrd);
    const roundTrippedKrd = convertFitToKrdRecord(fitResult);

    // Assert - timestamp within 1 second tolerance
    const originalTime = new Date(originalKrd.timestamp).getTime();
    const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(1000);

    // Assert - heart rate within 1 bpm
    expect(roundTrippedKrd.heartRate).toBe(originalKrd.heartRate);

    // Assert - power within 1W
    expect(roundTrippedKrd.power).toBe(originalKrd.power);

    // Assert - cadence within 1 rpm (fractional part now preserved)
    expect(roundTrippedKrd.cadence).toBeCloseTo(originalKrd.cadence, 1);

    // Assert - other fields preserved
    expect(roundTrippedKrd.distance).toBe(originalKrd.distance);
    expect(roundTrippedKrd.altitude).toBe(originalKrd.altitude);
    expect(roundTrippedKrd.speed).toBe(originalKrd.speed);
    expect(roundTrippedKrd.temperature).toBe(originalKrd.temperature);
  });

  it("should preserve running dynamics through round-trip", () => {
    // Arrange
    const originalKrd = {
      timestamp: "2024-01-01T00:00:00.000Z",
      verticalOscillation: 8.5,
      stanceTime: 250,
      stepLength: 1.2,
    };

    // Act
    const fitResult = convertKrdToFitRecord(originalKrd);
    const roundTrippedKrd = convertFitToKrdRecord(fitResult);

    // Assert
    expect(roundTrippedKrd.verticalOscillation).toBe(
      originalKrd.verticalOscillation
    );
    expect(roundTrippedKrd.stanceTime).toBe(originalKrd.stanceTime);
    expect(roundTrippedKrd.stepLength).toBe(originalKrd.stepLength);
  });
});
