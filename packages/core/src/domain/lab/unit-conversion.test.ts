import { describe, expect, it } from "vitest";

import { getLabParameter } from "./lab-parameter-catalog";
import {
  convertBound,
  convertMeasurement,
  fromCanonicalValue,
  toCanonicalValue,
} from "./unit-conversion";

const vitaminD = getLabParameter("vitamin_d");
const hba1c = getLabParameter("hba1c");

const HBA1C_CANONICAL = 6.5;
const HBA1C_RAW = 48;
const ROUND_TRIP_DIGITS = 6;
const VITAMIN_D_RANGE_LOW = 30;
const VITAMIN_D_RANGE_HIGH = 50;

describe("convertMeasurement", () => {
  it("should convert Vitamin D nmol/L to canonical ng/mL by the pure factor", () => {
    // Arrange
    const valueRaw = 60;

    // Act
    const result = convertMeasurement(vitaminD, valueRaw, "nmol/L");

    // Assert
    expect(result).toEqual({ valueCanonical: 24, unitCanonical: "ng/mL" });
  });

  it("should convert HbA1c mmol/mol to canonical % by the affine transform", () => {
    // Arrange
    const valueRaw = 48;

    // Act
    const result = convertMeasurement(hba1c, valueRaw, "mmol/mol");

    // Assert
    expect(result.unitCanonical).toBe("%");
    expect(result.valueCanonical).toBeCloseTo(HBA1C_CANONICAL, 1);
  });

  it("should pass through an unknown unit without conversion", () => {
    // Arrange
    const valueRaw = 12;

    // Act
    const result = convertMeasurement(vitaminD, valueRaw, "mystery-unit");

    // Assert
    expect(result).toEqual({
      valueCanonical: 12,
      unitCanonical: "mystery-unit",
    });
  });

  it("should pass through a free parameter (no catalog descriptor)", () => {
    // Arrange
    const valueRaw = 7.3;

    // Act
    const result = convertMeasurement(undefined, valueRaw, "arbitrary/unit");

    // Assert
    expect(result).toEqual({
      valueCanonical: 7.3,
      unitCanonical: "arbitrary/unit",
    });
  });
});

describe("convertBound", () => {
  it("should convert the Vitamin D report range 75-125 nmol/L to 30-50 ng/mL", () => {
    // Arrange
    const low = 75;
    const high = 125;

    // Act
    const lowCanonical = convertBound(vitaminD, low, "nmol/L");
    const highCanonical = convertBound(vitaminD, high, "nmol/L");

    // Assert
    expect(lowCanonical).toBe(VITAMIN_D_RANGE_LOW);
    expect(highCanonical).toBe(VITAMIN_D_RANGE_HIGH);
  });

  it("should return undefined for an absent bound", () => {
    // Arrange
    const bound = undefined;

    // Act
    const result = convertBound(vitaminD, bound, "nmol/L");

    // Assert
    expect(result).toBeUndefined();
  });
});

describe("affine round-trip", () => {
  it("should recover 48 mmol/mol from its canonical % value", () => {
    // Arrange
    const affine = { factorToCanonical: 0.0915, offsetToCanonical: 2.15 };

    // Act
    const canonical = toCanonicalValue(HBA1C_RAW, affine);
    const back = fromCanonicalValue(canonical, affine);

    // Assert
    expect(back).toBeCloseTo(HBA1C_RAW, ROUND_TRIP_DIGITS);
  });
});
