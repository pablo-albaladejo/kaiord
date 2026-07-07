import { getLabParameter } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { resolveEffectiveRefRange } from "./resolve-effective-ref-range";

const glucose = getLabParameter("glucose")!;
const ROUND_TRIP_DIGITS = 5;
const VITAMIN_D_RANGE_LOW = 30;
const VITAMIN_D_RANGE_HIGH = 50;

describe("resolveEffectiveRefRange", () => {
  it("should use the report range when refTouched carries a bound", () => {
    // Arrange
    const row = {
      refLowRaw: "80",
      refHighRaw: "110",
      refTouched: true,
      unitRaw: "mg/dL",
    };

    // Act
    const range = resolveEffectiveRefRange(glucose, row, undefined);

    // Assert
    expect(range).toEqual({
      refLow: 80,
      refHigh: 110,
      refLowCanonical: 80,
      refHighCanonical: 110,
      refSource: "report",
    });
  });

  it("should fall back to the catalog range when the report range was not touched", () => {
    // Arrange
    const row = {
      refLowRaw: "",
      refHighRaw: "",
      refTouched: false,
      unitRaw: "mg/dL",
    };

    // Act
    const range = resolveEffectiveRefRange(glucose, row, undefined);

    // Assert
    expect(range).toEqual({
      refLowCanonical: 70,
      refHighCanonical: 99,
      refSource: "catalog",
    });
  });

  it("should resolve to none for a custom parameter with no entered range", () => {
    // Arrange
    const row = {
      refLowRaw: "",
      refHighRaw: "",
      refTouched: false,
      unitRaw: "u",
    };

    // Act
    const range = resolveEffectiveRefRange(undefined, row, undefined);

    // Assert
    expect(range).toEqual({ refSource: "none" });
  });

  it("should convert the report range through the parameter's affine unit", () => {
    // Arrange
    const vitaminD = getLabParameter("vitamin_d")!;
    const row = {
      refLowRaw: "75",
      refHighRaw: "125",
      refTouched: true,
      unitRaw: "nmol/L",
    };

    // Act
    const range = resolveEffectiveRefRange(vitaminD, row, undefined);

    // Assert
    expect(range.refLowCanonical).toBeCloseTo(
      VITAMIN_D_RANGE_LOW,
      ROUND_TRIP_DIGITS
    );
    expect(range.refHighCanonical).toBeCloseTo(
      VITAMIN_D_RANGE_HIGH,
      ROUND_TRIP_DIGITS
    );
  });
});
