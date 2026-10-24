import { describe, expect, it } from "vitest";

import { TargetTypeId } from "../schemas/common";
import { mapRangeOrValue, mapZoneOrRange } from "./target-range.converter";
import { buildTargetType } from "./target-types";

const DISPLAY_ORDER = 3;
const TT = buildTargetType(TargetTypeId.CADENCE_ZONE, "cadence", DISPLAY_ORDER);
const LOW = 10;
const HIGH = 20;
const VALUE = 15;
const ZONE_NUMBER = 2;
const fixedBand = () => [LOW, HIGH] as const;

describe("mapRangeOrValue", () => {
  it.each([
    { fasterFirst: true, expected: [HIGH, LOW] },
    { fasterFirst: false, expected: [LOW, HIGH] },
  ])(
    "should order a range with fasterFirst=$fasterFirst",
    ({ fasterFirst, expected }) => {
      // Arrange
      const value = { unit: "range", min: LOW, max: HIGH };

      // Act
      const result = mapRangeOrValue(TT, value, fasterFirst);

      // Assert
      expect([result.targetValueOne, result.targetValueTwo]).toEqual(expected);
      expect(result.zoneNumber).toBeNull();
    }
  );

  it("should widen a single value with the band and apply the ordering", () => {
    // Arrange
    const value = { unit: "rpm", value: VALUE };

    // Act
    const result = mapRangeOrValue(TT, value, true, fixedBand);

    // Assert
    expect([result.targetValueOne, result.targetValueTwo]).toEqual([HIGH, LOW]);
  });

  it("should pass a single value through when the band declines it", () => {
    // Arrange
    const value = { unit: "rpm", value: VALUE };

    // Act
    const result = mapRangeOrValue(TT, value, true, () => null);

    // Assert
    expect([result.targetValueOne, result.targetValueTwo]).toEqual([
      VALUE,
      VALUE,
    ]);
  });
});

describe("mapZoneOrRange", () => {
  it("should keep a zone as a zone number without calling the band", () => {
    // Arrange
    const value = { unit: "zone", value: ZONE_NUMBER };

    // Act
    const result = mapZoneOrRange(TT, value, true, () => {
      throw new Error("band must not be called for a zone");
    });

    // Assert
    expect(result.zoneNumber).toBe(ZONE_NUMBER);
    expect(result.targetValueOne).toBeNull();
    expect(result.targetValueTwo).toBeNull();
  });
});
