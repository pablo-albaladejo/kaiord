import { describe, expect, it } from "vitest";

import { extractKaiordMetadata } from "./metadata-extractor";

describe("extractKaiordMetadata", () => {
  it("should extract created timestamp from kaiord attributes", () => {
    // Arrange
    const tcd = {
      "@_kaiord:timeCreated": "2024-01-15T10:00:00Z",
    };
    const workout = { sport: "cycling" as const, steps: [] };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result.created).toBe("2024-01-15T10:00:00Z");
  });

  it("should use current date when no created timestamp", () => {
    // Arrange
    const tcd = {};
    const workout = { sport: "cycling" as const, steps: [] };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result.created).toBeDefined();
    expect(typeof result.created).toBe("string");
  });

  it("should extract sport from workout", () => {
    // Arrange
    const tcd = {};
    const workout = { sport: "running" as const, steps: [] };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result.sport).toBe("running");
  });

  it("should extract subSport from workout", () => {
    // Arrange
    const tcd = {};
    const workout = {
      sport: "cycling" as const,
      subSport: "indoor_cycling" as const,
      steps: [],
    };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result.subSport).toBe("indoor_cycling");
  });

  it.each([
    ["@_kaiord:manufacturer", "Garmin", "manufacturer"],
    ["@_kaiord:product", "Edge 1040", "product"],
    ["@_kaiord:serialNumber", "ABC123", "serialNumber"],
  ])(
    "should extract %s from kaiord attributes",
    (attrKey, value, resultKey) => {
      // Arrange
      const tcd = { [attrKey]: value };
      const workout = { sport: "cycling" as const, steps: [] };

      // Act
      const result = extractKaiordMetadata(tcd, workout);

      // Assert
      expect(result[resultKey as keyof typeof result]).toBe(value);
    }
  );

  it("should convert numeric serialNumber to string", () => {
    // Arrange
    const tcd = {
      "@_kaiord:serialNumber": 12345,
    };
    const workout = { sport: "cycling" as const, steps: [] };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result.serialNumber).toBe("12345");
  });

  it.each([["manufacturer"], ["product"], ["serialNumber"]])(
    "should not include %s when not present",
    (resultKey) => {
      // Arrange
      const tcd = {};
      const workout = { sport: "cycling" as const, steps: [] };

      // Act
      const result = extractKaiordMetadata(tcd, workout);

      // Assert
      expect(result[resultKey as keyof typeof result]).toBeUndefined();
    }
  );

  it("should extract all metadata fields together", () => {
    // Arrange
    const tcd = {
      "@_kaiord:timeCreated": "2024-01-15T10:00:00Z",
      "@_kaiord:manufacturer": "Garmin",
      "@_kaiord:product": "Edge 1040",
      "@_kaiord:serialNumber": "ABC123",
    };
    const workout = {
      sport: "cycling" as const,
      subSport: "indoor_cycling" as const,
      steps: [],
    };

    // Act
    const result = extractKaiordMetadata(tcd, workout);

    // Assert
    expect(result).toStrictEqual({
      created: "2024-01-15T10:00:00Z",
      sport: "cycling",
      subSport: "indoor_cycling",
      manufacturer: "Garmin",
      product: "Edge 1040",
      serialNumber: "ABC123",
    });
  });
});
