import { describe, expect, it } from "vitest";

import { computeFlag } from "./lab-flag";

const creatinineFallback = {
  bySex: {
    male: { low: 0.7, high: 1.3 },
    female: { low: 0.6, high: 1.1 },
  },
};

describe("computeFlag", () => {
  it.each([
    { valueCanonical: 24, expected: "low" },
    { valueCanonical: 40, expected: "in" },
    { valueCanonical: 60, expected: "high" },
  ])(
    "should flag $valueCanonical against the report range 30-50 as $expected",
    ({ valueCanonical, expected }) => {
      // Arrange
      const input = {
        valueCanonical,
        refLowCanonical: 30,
        refHighCanonical: 50,
      };

      // Act
      const flag = computeFlag(input);

      // Assert
      expect(flag).toBe(expected);
    }
  );

  it("should prefer the report range over the catalog fallback", () => {
    // Arrange
    const input = {
      valueCanonical: 24,
      refLowCanonical: 30,
      refHighCanonical: 50,
      catalogFallback: { low: 10, high: 100 },
    };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("low");
  });

  it("should fall back to the catalog range when the report has none", () => {
    // Arrange
    const input = { valueCanonical: 5, catalogFallback: { low: 30 } };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("low");
  });

  it.each<{ sex?: "male" | "female"; expected: string }>([
    { sex: "female", expected: "high" },
    { sex: "male", expected: "in" },
    { sex: undefined, expected: "unknown" },
  ])(
    "should resolve the sex-aware catalog range for sex $sex as $expected",
    ({ sex, expected }) => {
      // Arrange
      const input = {
        valueCanonical: 1.2,
        catalogFallback: creatinineFallback,
        sex,
      };

      // Act
      const flag = computeFlag(input);

      // Assert
      expect(flag).toBe(expected);
    }
  );

  it("should return unknown when there is no range at all", () => {
    // Arrange
    const input = { valueCanonical: 5 };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("unknown");
  });

  it.each([
    { refText: "30-50", valueCanonical: 24, expected: "low" },
    { refText: "<200", valueCanonical: 250, expected: "high" },
    { refText: ">40", valueCanonical: 30, expected: "low" },
    { refText: "Negativo", valueCanonical: 1, expected: "unknown" },
  ])(
    "should parse refText $refText and flag $valueCanonical as $expected",
    ({ refText, valueCanonical, expected }) => {
      // Arrange
      const input = { valueCanonical, refText };

      // Act
      const flag = computeFlag(input);

      // Assert
      expect(flag).toBe(expected);
    }
  );
});
