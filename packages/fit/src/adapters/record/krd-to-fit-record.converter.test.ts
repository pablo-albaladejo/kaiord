import { describe, expect, it } from "vitest";

import {
  COORD_BARCELONA,
  COORD_PRECISION_5,
  COORD_ROUNDTRIP_SYDNEY,
  COORD_ROUNDTRIP_TOKYO,
  RECORD_BATCH_SAMPLE_SIZE,
  SAMPLE_CADENCE,
  SAMPLE_DISTANCE_M,
  SAMPLE_ELEVATION,
  SAMPLE_HR,
  SAMPLE_POWER,
  SAMPLE_RUN_DYNAMICS,
  SAMPLE_SPEED,
  SAMPLE_TEMPERATURE_C,
  SAMPLE_TIMESTAMP_2024_01_01_PLUS_1S,
  SAMPLE_TIMESTAMP_2024_01_01_PLUS_2S,
  SAMPLE_TIMESTAMP_2024_01_01_SEC,
  TIME_TOLERANCE_MS,
} from "../../test-utils/constants";
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
    expect(result.timestamp).toBe(SAMPLE_TIMESTAMP_2024_01_01_SEC);
  });

  it("should convert KRD record with GPS coordinates", () => {
    // Arrange
    const barcelonaLat = COORD_BARCELONA.LAT;
    const barcelonaLon = COORD_BARCELONA.LON;
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
    expect(semicirclesToDegrees(result.positionLat!)).toBeCloseTo(
      barcelonaLat,
      COORD_PRECISION_5
    );
    expect(semicirclesToDegrees(result.positionLong!)).toBeCloseTo(
      barcelonaLon,
      COORD_PRECISION_5
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
    expect(result.heartRate).toBe(SAMPLE_HR.AVG);
    expect(result.cadence).toBe(SAMPLE_CADENCE.AVG);
    expect(result.power).toBe(SAMPLE_POWER.RECORD);
    expect(result.distance).toBe(SAMPLE_DISTANCE_M);
    expect(result.altitude).toBe(SAMPLE_ELEVATION.ALT_ENHANCED_M);
    expect(result.speed).toBe(SAMPLE_SPEED.RECORD);
    expect(result.temperature).toBe(SAMPLE_TEMPERATURE_C);
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
    expect(result.verticalOscillation).toBe(SAMPLE_RUN_DYNAMICS.VERT_OSC);
    expect(result.stanceTime).toBe(SAMPLE_RUN_DYNAMICS.STANCE_TIME);
    expect(result.stepLength).toBe(SAMPLE_RUN_DYNAMICS.STEP_LENGTH);
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
    expect(results).toHaveLength(RECORD_BATCH_SAMPLE_SIZE);
    expect(results[0].timestamp).toBe(SAMPLE_TIMESTAMP_2024_01_01_SEC);
    expect(results[1].timestamp).toBe(SAMPLE_TIMESTAMP_2024_01_01_PLUS_1S);
    expect(results[2].timestamp).toBe(SAMPLE_TIMESTAMP_2024_01_01_PLUS_2S);
  });
});

describe("round-trip conversion", () => {
  it("should preserve coordinates through KRD -> FIT -> KRD", () => {
    // Arrange

    // Act
    const cities = [
      { name: "Barcelona", lat: COORD_BARCELONA.LAT, lon: COORD_BARCELONA.LON },
      {
        name: "Tokyo",
        lat: COORD_ROUNDTRIP_TOKYO.LAT,
        lon: COORD_ROUNDTRIP_TOKYO.LON,
      },
      {
        name: "Sydney",
        lat: COORD_ROUNDTRIP_SYDNEY.LAT,
        lon: COORD_ROUNDTRIP_SYDNEY.LON,
      },
    ];

    // Assert
    cities.forEach(({ lat, lon }) => {
      const originalKrd = {
        timestamp: "2024-01-01T00:00:00.000Z",
        position: { lat, lon },
      };

      const fitResult = convertKrdToFitRecord(originalKrd);
      const roundTrippedKrd = convertFitToKrdRecord(fitResult);

      expect(roundTrippedKrd.position?.lat).toBeCloseTo(lat, COORD_PRECISION_5);
      expect(roundTrippedKrd.position?.lon).toBeCloseTo(lon, COORD_PRECISION_5);
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
    const fitResult = convertKrdToFitRecord(originalKrd);
    const roundTrippedKrd = convertFitToKrdRecord(fitResult);
    const originalTime = new Date(originalKrd.timestamp).getTime();

    // Act
    const roundTrippedTime = new Date(roundTrippedKrd.timestamp).getTime();

    // Assert
    expect(Math.abs(originalTime - roundTrippedTime)).toBeLessThanOrEqual(
      TIME_TOLERANCE_MS
    );
    expect(roundTrippedKrd.heartRate).toBe(originalKrd.heartRate);
    expect(roundTrippedKrd.power).toBe(originalKrd.power);
    expect(roundTrippedKrd.cadence).toBeCloseTo(originalKrd.cadence, 1);
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
    const fitResult = convertKrdToFitRecord(originalKrd);

    // Act
    const roundTrippedKrd = convertFitToKrdRecord(fitResult);

    // Assert
    expect(roundTrippedKrd.verticalOscillation).toBe(
      originalKrd.verticalOscillation
    );
    expect(roundTrippedKrd.stanceTime).toBe(originalKrd.stanceTime);
    expect(roundTrippedKrd.stepLength).toBe(originalKrd.stepLength);
  });
});
