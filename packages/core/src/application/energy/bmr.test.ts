import { describe, expect, it } from "vitest";

import { type BmrInput, computeBmr } from "./bmr";

const MALE_BASE: BmrInput = {
  weightKg: 80,
  heightCm: 180,
  age: 30,
  sex: "male",
};

const FEMALE_BASE: BmrInput = {
  weightKg: 65,
  heightCm: 168,
  age: 30,
  sex: "female",
};

// Mifflin-St Jeor expected values, computed by hand from the formula
// 10*kg + 6.25*cm - 5*age + (male ? +5 : -161).
const MALE_MIFFLIN_KCAL = 1780; // 800 + 1125 - 150 + 5
const FEMALE_MIFFLIN_KCAL = 1389; // 650 + 1050 - 150 - 161

// Katch-McArdle: 370 + 21.6 * leanMass, leanMass = kg*(1-bodyFat).
const BODY_FAT_FRACTION = 0.2;
const MALE_KATCH_KCAL = 1752.4; // 370 + 21.6 * (80 * 0.8 = 64)
const MALE_KATCH_ZERO_FAT_KCAL = 2098; // 370 + 21.6 * 80

describe("computeBmr (Mifflin-St Jeor)", () => {
  it("should compute BMR for a male via Mifflin-St Jeor", () => {
    // Arrange
    const input = MALE_BASE;

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("mifflin-st-jeor");
    expect(result.kcal).toBeCloseTo(MALE_MIFFLIN_KCAL, 2);
  });

  it("should apply the female sex offset of minus 161", () => {
    // Arrange
    const input = FEMALE_BASE;

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("mifflin-st-jeor");
    expect(result.kcal).toBeCloseTo(FEMALE_MIFFLIN_KCAL, 2);
  });

  it("should ignore an out-of-range body-fat fraction and fall back to Mifflin", () => {
    // Arrange
    const input: BmrInput = { ...MALE_BASE, bodyFatFraction: 1 };

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("mifflin-st-jeor");
    expect(result.kcal).toBeCloseTo(MALE_MIFFLIN_KCAL, 2);
  });
});

describe("computeBmr (Katch-McArdle)", () => {
  it("should use Katch-McArdle when a valid body-fat fraction is provided", () => {
    // Arrange
    const input: BmrInput = {
      ...MALE_BASE,
      bodyFatFraction: BODY_FAT_FRACTION,
    };

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("katch-mcardle");
    expect(result.kcal).toBeCloseTo(MALE_KATCH_KCAL, 2);
  });

  it("should treat a zero body-fat fraction as known and use Katch-McArdle", () => {
    // Arrange
    const input: BmrInput = { ...MALE_BASE, bodyFatFraction: 0 };

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("katch-mcardle");
    expect(result.kcal).toBeCloseTo(MALE_KATCH_ZERO_FAT_KCAL, 2);
  });

  it("should ignore a non-finite body-fat fraction and use Mifflin", () => {
    // Arrange
    const input: BmrInput = { ...MALE_BASE, bodyFatFraction: Number.NaN };

    // Act
    const result = computeBmr(input);

    // Assert
    expect(result.formula).toBe("mifflin-st-jeor");
  });
});

describe("computeBmr (input guards)", () => {
  it.each([
    ["zero weight", { ...MALE_BASE, weightKg: 0 }],
    ["negative height", { ...MALE_BASE, heightCm: -1 }],
    ["non-finite age", { ...MALE_BASE, age: Number.POSITIVE_INFINITY }],
  ])("should throw RangeError for %s", (_label, input) => {
    // Arrange
    const act = () => computeBmr(input as BmrInput);

    // Act

    // Assert
    expect(act).toThrow(RangeError);
  });
});
