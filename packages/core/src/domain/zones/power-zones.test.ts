import { describe, expect, it } from "vitest";

import {
  isPowerZone,
  percentFtpToZone,
  POWER_ZONE_PERCENT_FTP,
  POWER_ZONES,
  type PowerZone,
  zoneToPercentFtp,
} from "./power-zones";

// Canonical zone-percent table mirrored as test data so each assertion
// references a named constant rather than a bare numeric literal.
const Z1 = 1;
const Z2 = 2;
const Z3 = 3;
const Z4 = 4;
const Z5 = 5;
const Z6 = 6;
const Z7 = 7;
const Z8_OUT_OF_RANGE = 8;
const Z_NEGATIVE = -1;
const Z_NON_INTEGER = 1.5;
const Z_OUT_OF_BAND = 42;

const PCT_Z1 = 55;
const PCT_Z2 = 75;
const PCT_Z3 = 90;
const PCT_Z4 = 105;
const PCT_Z5 = 120;
const PCT_Z6 = 150;
const PCT_Z7 = 200;

const NON_CANONICAL_PERCENT_PLUS_ONE = 56;
const NON_CANONICAL_PERCENT_NEAR_Z6 = 199;
const NON_CANONICAL_PERCENT_NEAR_Z7 = 201;
const NON_CANONICAL_PERCENT_HUNDRED = 100;

const VALID_ZONES = [Z1, Z2, Z3, Z4, Z5, Z6, Z7] as const;
const CANONICAL_PERCENTS = [
  PCT_Z1,
  PCT_Z2,
  PCT_Z3,
  PCT_Z4,
  PCT_Z5,
  PCT_Z6,
  PCT_Z7,
] as const;

const ZONE_TO_PERCENT_TABLE = [
  [Z1, PCT_Z1],
  [Z2, PCT_Z2],
  [Z3, PCT_Z3],
  [Z4, PCT_Z4],
  [Z5, PCT_Z5],
  [Z6, PCT_Z6],
  [Z7, PCT_Z7],
] as const;

const PERCENT_TO_ZONE_TABLE = [
  [PCT_Z1, Z1],
  [PCT_Z2, Z2],
  [PCT_Z3, Z3],
  [PCT_Z4, Z4],
  [PCT_Z5, Z5],
  [PCT_Z6, Z6],
  [PCT_Z7, Z7],
] as const;

describe("POWER_ZONES", () => {
  it("should enumerate the seven Coggan power zones in order", () => {
    // Arrange
    const expected = [...VALID_ZONES];

    // Act
    const actual = [...POWER_ZONES];

    // Assert
    expect(actual).toStrictEqual(expected);
  });
});

describe("POWER_ZONE_PERCENT_FTP", () => {
  it("should map each zone 1..7 to its canonical percent-FTP value", () => {
    // Arrange
    const expected: Record<PowerZone, number> = {
      [Z1]: PCT_Z1,
      [Z2]: PCT_Z2,
      [Z3]: PCT_Z3,
      [Z4]: PCT_Z4,
      [Z5]: PCT_Z5,
      [Z6]: PCT_Z6,
      [Z7]: PCT_Z7,
    };

    // Act
    const actual = POWER_ZONE_PERCENT_FTP;

    // Assert
    expect(actual).toStrictEqual(expected);
  });

  it("should expose values that are strictly increasing across the zone sequence", () => {
    // Arrange
    const values = POWER_ZONES.map((z) => POWER_ZONE_PERCENT_FTP[z]);

    // Act
    const isStrictlyIncreasing = values.every(
      (v, i) => i === 0 || v > values[i - 1]
    );

    // Assert
    expect(isStrictlyIncreasing).toBe(true);
  });
});

describe("isPowerZone", () => {
  it.each([...VALID_ZONES])("should return true for valid zone %i", (zone) => {
    // Arrange

    // Act
    const result = isPowerZone(zone);

    // Assert
    expect(result).toBe(true);
  });

  it.each([
    0,
    Z8_OUT_OF_RANGE,
    Z_NEGATIVE,
    Z_NON_INTEGER,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("should return false for invalid input %s", (value) => {
    // Arrange

    // Act
    const result = isPowerZone(value);

    // Assert
    expect(result).toBe(false);
  });
});

describe("zoneToPercentFtp (exhaustive enumeration)", () => {
  it.each(ZONE_TO_PERCENT_TABLE)(
    "should map zone %i to %i%% FTP",
    (zone, expected) => {
      // Arrange

      // Act
      const result = zoneToPercentFtp(zone);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it("should return positive finite numbers monotonically non-decreasing across the zone sequence", () => {
    // Arrange
    const results = POWER_ZONES.map((z) => zoneToPercentFtp(z));

    // Act
    const allPositiveFinite = results.every((v) => Number.isFinite(v) && v > 0);
    const isNonDecreasing = results.every(
      (v, i) => i === 0 || v >= results[i - 1]
    );

    // Assert
    expect(allPositiveFinite).toBe(true);
    expect(isNonDecreasing).toBe(true);
  });
});

describe("zoneToPercentFtp (boundary rejections)", () => {
  it.each([
    ["0", 0],
    ["8 (above range)", Z8_OUT_OF_RANGE],
    ["-1 (negative)", Z_NEGATIVE],
    ["1.5 (non-integer)", Z_NON_INTEGER],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
  ])("should throw RangeError for %s", (_label, input) => {
    // Arrange

    // Act
    const act = () => zoneToPercentFtp(input as number);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should mention the offending value in the error message", () => {
    // Arrange
    const invalid = Z_OUT_OF_BAND;

    // Act
    const act = () => zoneToPercentFtp(invalid);

    // Assert
    expect(act).toThrow(/42/);
  });
});

describe("percentFtpToZone (exhaustive inverse)", () => {
  it.each(PERCENT_TO_ZONE_TABLE)(
    "should map %i%% FTP back to zone %i",
    (percent, expected) => {
      // Arrange

      // Act
      const result = percentFtpToZone(percent);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it.each([
    0,
    NON_CANONICAL_PERCENT_PLUS_ONE,
    NON_CANONICAL_PERCENT_HUNDRED,
    NON_CANONICAL_PERCENT_NEAR_Z6,
    NON_CANONICAL_PERCENT_NEAR_Z7,
    Z_NEGATIVE,
    Z_NON_INTEGER,
  ])("should throw RangeError for non-canonical percent %s", (percent) => {
    // Arrange

    // Act
    const act = () => percentFtpToZone(percent);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "should throw RangeError for non-finite input %s",
    (percent) => {
      // Arrange

      // Act
      const act = () => percentFtpToZone(percent);

      // Assert
      expect(act).toThrow(RangeError);
    }
  );
});

describe("round-trip identity", () => {
  it.each([...VALID_ZONES])(
    "should satisfy percentFtpToZone(zoneToPercentFtp(%i)) === %i",
    (zone) => {
      // Arrange

      // Act
      const roundTripped = percentFtpToZone(zoneToPercentFtp(zone));

      // Assert
      expect(roundTripped).toBe(zone);
    }
  );

  it.each([...CANONICAL_PERCENTS])(
    "should satisfy zoneToPercentFtp(percentFtpToZone(%i)) === %i",
    (percent) => {
      // Arrange

      // Act
      const roundTripped = zoneToPercentFtp(percentFtpToZone(percent));

      // Assert
      expect(roundTripped).toBe(percent);
    }
  );
});
