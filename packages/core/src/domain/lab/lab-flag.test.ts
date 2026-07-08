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

  it("should apply the female catalog range when sex is female", () => {
    // Arrange
    const input = {
      valueCanonical: 1.2,
      catalogFallback: creatinineFallback,
      sex: "female" as const,
    };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("high");
  });

  it("should apply the male catalog range when sex is male", () => {
    // Arrange
    const input = {
      valueCanonical: 1.2,
      catalogFallback: creatinineFallback,
      sex: "male" as const,
    };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("in");
  });

  it("should return unknown for a sex-only fallback when sex is absent", () => {
    // Arrange
    const input = { valueCanonical: 1.2, catalogFallback: creatinineFallback };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("unknown");
  });

  it("should return unknown when there is no range at all", () => {
    // Arrange
    const input = { valueCanonical: 5 };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("unknown");
  });

  it("should return unknown for a non-numeric refText", () => {
    // Arrange
    const input = { valueCanonical: 1, refText: "Negativo" };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("unknown");
  });

  it("should parse a numeric refText range and flag accordingly", () => {
    // Arrange
    const input = { valueCanonical: 24, refText: "30-50" };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("low");
  });

  it("should parse a less-than refText as an upper bound", () => {
    // Arrange
    const input = { valueCanonical: 250, refText: "<200" };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("high");
  });

  it("should parse a greater-than refText as a lower bound", () => {
    // Arrange
    const input = { valueCanonical: 30, refText: ">40" };

    // Act
    const flag = computeFlag(input);

    // Assert
    expect(flag).toBe("low");
  });
});
