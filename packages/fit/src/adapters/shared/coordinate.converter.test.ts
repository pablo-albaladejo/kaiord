import { describe, expect, it } from "vitest";

import {
  degreesToSemicircles,
  semicirclesToDegrees,
  validateCoordinates,
} from "./coordinate.converter";

describe("semicirclesToDegrees", () => {
  it("should convert 0 semicircles to 0 degrees", () => {
    // Arrange

    // Act

    // Assert
    expect(semicirclesToDegrees(0)).toBe(0);
  });

  it("should convert positive semicircles to positive degrees", () => {
    // Arrange

    // Act
    const maxSemicircles = Math.pow(2, 31);

    // Assert
    expect(semicirclesToDegrees(maxSemicircles)).toBeCloseTo(180, 6);
  });

  it("should convert negative semicircles to negative degrees", () => {
    // Arrange

    // Act
    const minSemicircles = -Math.pow(2, 31);

    // Assert
    expect(semicirclesToDegrees(minSemicircles)).toBeCloseTo(-180, 6);
  });

  it("should convert real GPS coordinates correctly", () => {
    // Arrange
    const barcelonaLat = 41.3851;
    const barcelonaLon = 2.1734;
    const barcelonaLatSemi = degreesToSemicircles(barcelonaLat);

    // Act
    const barcelonaLonSemi = degreesToSemicircles(barcelonaLon);

    // Assert
    expect(semicirclesToDegrees(barcelonaLatSemi)).toBeCloseTo(barcelonaLat, 5);
    expect(semicirclesToDegrees(barcelonaLonSemi)).toBeCloseTo(barcelonaLon, 5);
  });
});

describe("degreesToSemicircles", () => {
  it("should convert 0 degrees to 0 semicircles", () => {
    // Arrange

    // Act

    // Assert
    expect(degreesToSemicircles(0)).toBe(0);
  });

  it("should convert 180 degrees to max semicircles", () => {
    // Arrange

    // Act
    const maxSemicircles = Math.pow(2, 31);

    // Assert
    expect(degreesToSemicircles(180)).toBe(maxSemicircles);
  });

  it("should convert -180 degrees to min semicircles", () => {
    // Arrange

    // Act
    const minSemicircles = -Math.pow(2, 31);

    // Assert
    expect(degreesToSemicircles(-180)).toBe(minSemicircles);
  });

  it("should round to integer", () => {
    // Arrange

    // Act
    const result = degreesToSemicircles(41.3851);

    // Assert
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("round-trip conversion", () => {
  it("should preserve precision within 6 decimal places", () => {
    // Arrange

    // Act
    const coordinates = [
      { lat: 41.385064, lon: 2.173404 }, // Barcelona
      { lat: 40.416775, lon: -3.70379 }, // Madrid
      { lat: 51.507351, lon: -0.127758 }, // London
      { lat: -33.86882, lon: 151.20929 }, // Sydney
      { lat: 35.689487, lon: 139.691711 }, // Tokyo
    ];

    // Assert
    coordinates.forEach(({ lat, lon }) => {
      const latSemi = degreesToSemicircles(lat);
      const lonSemi = degreesToSemicircles(lon);

      const resultLat = semicirclesToDegrees(latSemi);
      const resultLon = semicirclesToDegrees(lonSemi);

      expect(resultLat).toBeCloseTo(lat, 6);
      expect(resultLon).toBeCloseTo(lon, 6);
    });
  });
});

describe("validateCoordinates", () => {
  it("should return true for valid coordinates", () => {
    // Arrange
    const latSemi = degreesToSemicircles(41.3851);

    // Act
    const lonSemi = degreesToSemicircles(2.1734);

    // Assert
    expect(validateCoordinates(latSemi, lonSemi)).toBe(true);
  });

  it("should return true for edge case coordinates", () => {
    // Arrange

    // Act

    // Assert
    expect(
      validateCoordinates(degreesToSemicircles(90), degreesToSemicircles(0))
    ).toBe(true);
    expect(
      validateCoordinates(degreesToSemicircles(-90), degreesToSemicircles(0))
    ).toBe(true);
    expect(
      validateCoordinates(degreesToSemicircles(0), degreesToSemicircles(180))
    ).toBe(true);
    expect(
      validateCoordinates(degreesToSemicircles(0), degreesToSemicircles(-180))
    ).toBe(true);
  });

  it("should return false for NaN", () => {
    // Arrange

    // Act

    // Assert
    expect(validateCoordinates(NaN, 0)).toBe(false);
    expect(validateCoordinates(0, NaN)).toBe(false);
    expect(validateCoordinates(NaN, NaN)).toBe(false);
  });

  it("should return false for Infinity", () => {
    // Arrange

    // Act

    // Assert
    expect(validateCoordinates(Infinity, 0)).toBe(false);
    expect(validateCoordinates(0, -Infinity)).toBe(false);
  });

  it("should return false for out-of-range latitude", () => {
    // Arrange

    // Act
    const invalidLatSemi = degreesToSemicircles(91);

    // Assert
    expect(validateCoordinates(invalidLatSemi, 0)).toBe(false);
  });

  it("should return false for out-of-range longitude", () => {
    // Arrange

    // Act
    const invalidLonSemi = degreesToSemicircles(181);

    // Assert
    expect(validateCoordinates(0, invalidLonSemi)).toBe(false);
  });
});
