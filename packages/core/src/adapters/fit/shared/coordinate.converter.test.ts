import { describe, expect, it } from "vitest";
import {
  degreesToSemicircles,
  semicirclesToDegrees,
  validateCoordinates,
} from "./coordinate.converter";

describe("semicirclesToDegrees", () => {
  it("should convert 0 semicircles to 0 degrees", () => {
    expect(semicirclesToDegrees(0)).toBe(0);
  });

  it("should convert positive semicircles to positive degrees", () => {
    // 2^31 semicircles = 180 degrees
    const maxSemicircles = Math.pow(2, 31);

    expect(semicirclesToDegrees(maxSemicircles)).toBeCloseTo(180, 6);
  });

  it("should convert negative semicircles to negative degrees", () => {
    const minSemicircles = -Math.pow(2, 31);

    expect(semicirclesToDegrees(minSemicircles)).toBeCloseTo(-180, 6);
  });

  it("should convert real GPS coordinates correctly", () => {
    // Barcelona: 41.3851° N, 2.1734° E
    // Calculate semicircles from degrees for test
    const barcelonaLat = 41.3851;
    const barcelonaLon = 2.1734;
    const barcelonaLatSemi = degreesToSemicircles(barcelonaLat);
    const barcelonaLonSemi = degreesToSemicircles(barcelonaLon);

    expect(semicirclesToDegrees(barcelonaLatSemi)).toBeCloseTo(barcelonaLat, 5);
    expect(semicirclesToDegrees(barcelonaLonSemi)).toBeCloseTo(barcelonaLon, 5);
  });
});

describe("degreesToSemicircles", () => {
  it("should convert 0 degrees to 0 semicircles", () => {
    expect(degreesToSemicircles(0)).toBe(0);
  });

  it("should convert 180 degrees to max semicircles", () => {
    const maxSemicircles = Math.pow(2, 31);

    expect(degreesToSemicircles(180)).toBe(maxSemicircles);
  });

  it("should convert -180 degrees to min semicircles", () => {
    const minSemicircles = -Math.pow(2, 31);

    expect(degreesToSemicircles(-180)).toBe(minSemicircles);
  });

  it("should round to integer", () => {
    const result = degreesToSemicircles(41.3851);

    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("round-trip conversion", () => {
  it("should preserve precision within 6 decimal places", () => {
    const coordinates = [
      { lat: 41.385064, lon: 2.173404 }, // Barcelona
      { lat: 40.416775, lon: -3.70379 }, // Madrid
      { lat: 51.507351, lon: -0.127758 }, // London
      { lat: -33.86882, lon: 151.20929 }, // Sydney
      { lat: 35.689487, lon: 139.691711 }, // Tokyo
    ];

    coordinates.forEach(({ lat, lon }) => {
      // Arrange
      const latSemi = degreesToSemicircles(lat);
      const lonSemi = degreesToSemicircles(lon);

      // Act
      const resultLat = semicirclesToDegrees(latSemi);
      const resultLon = semicirclesToDegrees(lonSemi);

      // Assert - precision within 6 decimal places
      expect(resultLat).toBeCloseTo(lat, 6);
      expect(resultLon).toBeCloseTo(lon, 6);
    });
  });
});

describe("validateCoordinates", () => {
  it("should return true for valid coordinates", () => {
    const latSemi = degreesToSemicircles(41.3851);
    const lonSemi = degreesToSemicircles(2.1734);

    expect(validateCoordinates(latSemi, lonSemi)).toBe(true);
  });

  it("should return true for edge case coordinates", () => {
    // North Pole
    expect(
      validateCoordinates(degreesToSemicircles(90), degreesToSemicircles(0))
    ).toBe(true);

    // South Pole
    expect(
      validateCoordinates(degreesToSemicircles(-90), degreesToSemicircles(0))
    ).toBe(true);

    // International Date Line
    expect(
      validateCoordinates(degreesToSemicircles(0), degreesToSemicircles(180))
    ).toBe(true);
    expect(
      validateCoordinates(degreesToSemicircles(0), degreesToSemicircles(-180))
    ).toBe(true);
  });

  it("should return false for NaN", () => {
    expect(validateCoordinates(NaN, 0)).toBe(false);
    expect(validateCoordinates(0, NaN)).toBe(false);
    expect(validateCoordinates(NaN, NaN)).toBe(false);
  });

  it("should return false for Infinity", () => {
    expect(validateCoordinates(Infinity, 0)).toBe(false);
    expect(validateCoordinates(0, -Infinity)).toBe(false);
  });

  it("should return false for out-of-range latitude", () => {
    // Latitude > 90°
    const invalidLatSemi = degreesToSemicircles(91);

    expect(validateCoordinates(invalidLatSemi, 0)).toBe(false);
  });

  it("should return false for out-of-range longitude", () => {
    // Longitude > 180°
    const invalidLonSemi = degreesToSemicircles(181);

    expect(validateCoordinates(0, invalidLonSemi)).toBe(false);
  });
});
