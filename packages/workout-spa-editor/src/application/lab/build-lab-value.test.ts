import { describe, expect, it } from "vitest";

import { buildLabValue, type LabValueRowInput } from "./build-lab-value";

const CTX = { id: "v1", profileId: "p1", reportId: "r1", date: "2026-03-05" };
const ROUND_TRIP_DIGITS = 5;
const HBA1C_CANONICAL = 6.5;
const HBA1C_DIGITS = 1;
const VITAMIN_D_CANONICAL = 24;
const VITAMIN_D_RANGE_LOW = 30;
const VITAMIN_D_RANGE_HIGH = 50;

const row = (overrides: Partial<LabValueRowInput>): LabValueRowInput => ({
  parameterKey: "glucose",
  valueRaw: "90",
  unitRaw: "mg/dL",
  refLowRaw: "",
  refHighRaw: "",
  refTouched: false,
  ...overrides,
});

describe("buildLabValue", () => {
  it("should build a catalog value in its canonical unit with an in-range flag", () => {
    // Arrange
    const input = row({});

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    expect(value).toMatchObject({
      parameterKey: "glucose",
      valueCanonical: 90,
      unitCanonical: "mg/dL",
      refSource: "catalog",
      flag: "in",
      provenance: { source: "manual" },
    });
  });

  it("should convert a known non-canonical unit witness (Vit D nmol/L -> ng/mL)", () => {
    // Arrange
    const input = row({
      parameterKey: "vitamin_d",
      valueRaw: "60",
      unitRaw: "nmol/L",
    });

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    expect(value?.valueCanonical).toBeCloseTo(
      VITAMIN_D_CANONICAL,
      ROUND_TRIP_DIGITS
    );
    expect(value?.unitCanonical).toBe("ng/mL");
  });

  it("should convert HbA1c mmol/mol to % with the affine offset (48 -> 6.5)", () => {
    // Arrange
    const input = row({
      parameterKey: "hba1c",
      valueRaw: "48",
      unitRaw: "mmol/mol",
    });

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    // The 0.0915 factor is a 1-decimal-precision witness (core's own
    // unit-conversion.test.ts asserts the same tolerance).
    expect(value?.valueCanonical).toBeCloseTo(HBA1C_CANONICAL, HBA1C_DIGITS);
    expect(value?.unitCanonical).toBe("%");
  });

  it("should flag low using the report range converted to canonical (C1 witness)", () => {
    // Arrange
    // Vit D 60 nmol/L vs report range 75-125 nmol/L -> 24 vs 30-50 ng/mL.
    const input = row({
      parameterKey: "vitamin_d",
      valueRaw: "60",
      unitRaw: "nmol/L",
      refLowRaw: "75",
      refHighRaw: "125",
      refTouched: true,
    });

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    expect(value?.refSource).toBe("report");
    expect(value?.refLowCanonical).toBeCloseTo(
      VITAMIN_D_RANGE_LOW,
      ROUND_TRIP_DIGITS
    );
    expect(value?.refHighCanonical).toBeCloseTo(
      VITAMIN_D_RANGE_HIGH,
      ROUND_TRIP_DIGITS
    );
    expect(value?.flag).toBe("low");
  });

  it("should apply sex-aware catalog fallback when the report range is untouched", () => {
    // Arrange
    const input = row({
      parameterKey: "creatinine",
      valueRaw: "1.2",
      unitRaw: "mg/dL",
    });

    // Act
    const female = buildLabValue(input, { ...CTX, sex: "female" });

    // Assert
    // Female range is 0.6-1.1, so 1.2 is high.
    expect(female?.flag).toBe("high");
  });

  it("should flag unknown when the entered unit is not convertible to canonical", () => {
    // Arrange
    // glucose 5.5 mmol/L is a passthrough (no known mmol/L unit); the mg/dL
    // catalog range must not be applied, so the flag stays unknown, not low.
    const input = row({
      parameterKey: "glucose",
      valueRaw: "5.5",
      unitRaw: "mmol/L",
    });

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    expect(value).toMatchObject({
      valueCanonical: 5.5,
      unitCanonical: "mmol/L",
      refSource: "none",
      flag: "unknown",
    });
    expect(value?.refLowCanonical).toBeUndefined();
  });

  it("should store a custom parameter's value and unit as entered, without conversion", () => {
    // Arrange
    const input = row({
      parameterKey: "custom:apo-e",
      valueRaw: "3.1",
      unitRaw: "ratio",
    });

    // Act
    const value = buildLabValue(input, CTX);

    // Assert
    expect(value).toMatchObject({
      valueRaw: 3.1,
      valueCanonical: 3.1,
      unitRaw: "ratio",
      unitCanonical: "ratio",
      refSource: "none",
      flag: "unknown",
    });
  });

  it("should skip a blank row (no parameter, value, or unit) as undefined", () => {
    // Arrange
    const blank = row({ parameterKey: "", valueRaw: "", unitRaw: "" });

    // Act
    const value = buildLabValue(blank, CTX);

    // Assert
    expect(value).toBeUndefined();
  });

  it("should carry ai-extracted provenance when the context requests it", () => {
    // Arrange
    const input = row({});

    // Act
    const value = buildLabValue(input, { ...CTX, provenance: "ai-extracted" });

    // Assert
    expect(value?.provenance).toEqual({ source: "ai-extracted" });
  });
});
