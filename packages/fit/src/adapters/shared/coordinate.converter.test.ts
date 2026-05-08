import { describe, expect, it } from "vitest";

import {
  COORD_BARCELONA,
  COORD_BARCELONA_PRECISE,
  COORD_LONDON,
  COORD_MADRID,
  COORD_PRECISION_5,
  COORD_PRECISION_6,
  COORD_SYDNEY,
  COORD_TOKYO,
  LAT_INVALID_DEG,
  LAT_MAX_DEG,
  LON_INVALID_DEG,
  LON_MAX_DEG,
  SEMICIRCLE_EXP,
} from "../../test-utils/constants";
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
    const maxSemicircles = Math.pow(2, SEMICIRCLE_EXP);

    // Assert
    expect(semicirclesToDegrees(maxSemicircles)).toBeCloseTo(
      LON_MAX_DEG,
      COORD_PRECISION_6
    );
  });

  it("should convert negative semicircles to negative degrees", () => {
    // Arrange

    // Act
    const minSemicircles = -Math.pow(2, SEMICIRCLE_EXP);

    // Assert
    expect(semicirclesToDegrees(minSemicircles)).toBeCloseTo(
      -LON_MAX_DEG,
      COORD_PRECISION_6
    );
  });

  it("should convert real GPS coordinates correctly", () => {
    // Arrange
    const barcelonaLat = COORD_BARCELONA.LAT;
    const barcelonaLon = COORD_BARCELONA.LON;
    const barcelonaLatSemi = degreesToSemicircles(barcelonaLat);

    // Act
    const barcelonaLonSemi = degreesToSemicircles(barcelonaLon);

    // Assert
    expect(semicirclesToDegrees(barcelonaLatSemi)).toBeCloseTo(
      barcelonaLat,
      COORD_PRECISION_5
    );
    expect(semicirclesToDegrees(barcelonaLonSemi)).toBeCloseTo(
      barcelonaLon,
      COORD_PRECISION_5
    );
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
    const maxSemicircles = Math.pow(2, SEMICIRCLE_EXP);

    // Assert
    expect(degreesToSemicircles(LON_MAX_DEG)).toBe(maxSemicircles);
  });

  it("should convert -180 degrees to min semicircles", () => {
    // Arrange

    // Act
    const minSemicircles = -Math.pow(2, SEMICIRCLE_EXP);

    // Assert
    expect(degreesToSemicircles(-LON_MAX_DEG)).toBe(minSemicircles);
  });

  it("should round to integer", () => {
    // Arrange

    // Act
    const result = degreesToSemicircles(COORD_BARCELONA.LAT);

    // Assert
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("round-trip conversion", () => {
  it("should preserve precision within 6 decimal places", () => {
    // Arrange

    // Act
    const coordinates = [
      { lat: COORD_BARCELONA_PRECISE.LAT, lon: COORD_BARCELONA_PRECISE.LON },
      { lat: COORD_MADRID.LAT, lon: COORD_MADRID.LON },
      { lat: COORD_LONDON.LAT, lon: COORD_LONDON.LON },
      { lat: COORD_SYDNEY.LAT, lon: COORD_SYDNEY.LON },
      { lat: COORD_TOKYO.LAT, lon: COORD_TOKYO.LON },
    ];

    // Assert
    coordinates.forEach(({ lat, lon }) => {
      const latSemi = degreesToSemicircles(lat);
      const lonSemi = degreesToSemicircles(lon);

      const resultLat = semicirclesToDegrees(latSemi);
      const resultLon = semicirclesToDegrees(lonSemi);

      expect(resultLat).toBeCloseTo(lat, COORD_PRECISION_6);
      expect(resultLon).toBeCloseTo(lon, COORD_PRECISION_6);
    });
  });
});

describe("validateCoordinates", () => {
  it("should return true for valid coordinates", () => {
    // Arrange
    const latSemi = degreesToSemicircles(COORD_BARCELONA.LAT);

    // Act
    const lonSemi = degreesToSemicircles(COORD_BARCELONA.LON);

    // Assert
    expect(validateCoordinates(latSemi, lonSemi)).toBe(true);
  });

  it("should return true for edge case coordinates", () => {
    // Arrange

    // Act

    // Assert
    expect(
      validateCoordinates(
        degreesToSemicircles(LAT_MAX_DEG),
        degreesToSemicircles(0)
      )
    ).toBe(true);
    expect(
      validateCoordinates(
        degreesToSemicircles(-LAT_MAX_DEG),
        degreesToSemicircles(0)
      )
    ).toBe(true);
    expect(
      validateCoordinates(
        degreesToSemicircles(0),
        degreesToSemicircles(LON_MAX_DEG)
      )
    ).toBe(true);
    expect(
      validateCoordinates(
        degreesToSemicircles(0),
        degreesToSemicircles(-LON_MAX_DEG)
      )
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
    const invalidLatSemi = degreesToSemicircles(LAT_INVALID_DEG);

    // Assert
    expect(validateCoordinates(invalidLatSemi, 0)).toBe(false);
  });

  it("should return false for out-of-range longitude", () => {
    // Arrange

    // Act
    const invalidLonSemi = degreesToSemicircles(LON_INVALID_DEG);

    // Assert
    expect(validateCoordinates(0, invalidLonSemi)).toBe(false);
  });
});
