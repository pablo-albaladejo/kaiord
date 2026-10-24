import { type Target, targetSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  FLOAT_DIGITS,
  PACE_M_PER_S,
  POWER_W,
  TARGET_BAND,
} from "../../test-utils/constants";
import { convertGarminTargetToKrd } from "./target-from-garmin.converter";
import { convertKrdTargetToGarmin } from "./target-to-garmin.converter";

describe("convertGarminTargetToKrd range normalization", () => {
  it.each([
    {
      key: "slower-first pace",
      targetTypeKey: "pace.zone",
      v1: 3.57,
      v2: 3.7,
      expected: {
        type: "pace",
        value: { unit: "range", min: 3.57, max: 3.7 },
      },
    },
    {
      key: "faster-first pace",
      targetTypeKey: "pace.zone",
      v1: 3.7,
      v2: 3.57,
      expected: {
        type: "pace",
        value: { unit: "range", min: 3.57, max: 3.7 },
      },
    },
    {
      key: "higher-first power",
      targetTypeKey: "power.zone",
      v1: POWER_W.RANGE_HIGH,
      v2: POWER_W.RANGE_LOW,
      expected: {
        type: "power",
        value: {
          unit: "range",
          min: POWER_W.RANGE_LOW,
          max: POWER_W.RANGE_HIGH,
        },
      },
    },
  ])(
    "should normalize a $key range into [min, max]",
    ({ targetTypeKey, v1, v2, expected }) => {
      // Arrange

      // Act
      const result = convertGarminTargetToKrd(targetTypeKey, v1, v2, null);

      // Assert
      expect(result.targetType).toBe(expected.type);
      expect(result.target).toEqual(expected);
    }
  );
});

const roundTripPace = (mps: number) => {
  const target: Target = { type: "pace", value: { unit: "mps", value: mps } };
  const garmin = convertKrdTargetToGarmin(target);
  return convertGarminTargetToKrd(
    garmin.targetType.workoutTargetTypeKey,
    garmin.targetValueOne,
    garmin.targetValueTwo,
    garmin.zoneNumber
  );
};

describe("single-value pace round-trip", () => {
  it("should read a single pace value back as its ±5 s/km band range (round-trip is not exact)", () => {
    // Arrange
    const mps = PACE_M_PER_S.SINGLE_4_45;

    // Act
    const result = roundTripPace(mps);

    // Assert
    // KRD mps -> Garmin band -> KRD range: the unit changes and the band
    // widens, by design, so a single value never round-trips exactly.
    expect(result.targetType).toBe("pace");
    const value = result.target.value as {
      unit: string;
      min: number;
      max: number;
    };
    expect(value.unit).toBe("range");
    expect(value.min).toBeCloseTo(PACE_M_PER_S.BAND_4_50, FLOAT_DIGITS);
    expect(value.max).toBeCloseTo(PACE_M_PER_S.BAND_4_40, FLOAT_DIGITS);
  });

  it("should keep the re-imported band within the pace schema at the max speed (round-trip)", () => {
    // Arrange
    const mps = PACE_M_PER_S.SCHEMA_MAX;

    // Act
    const result = roundTripPace(mps);

    // Assert
    expect(targetSchema.safeParse(result.target).success).toBe(true);
  });
});

const roundTrip = (target: Target) => {
  const garmin = convertKrdTargetToGarmin(target);
  return convertGarminTargetToKrd(
    garmin.targetType.workoutTargetTypeKey,
    garmin.targetValueOne,
    garmin.targetValueTwo,
    garmin.zoneNumber
  );
};

describe("single-value power, heart-rate and cadence round-trip", () => {
  it.each([
    {
      type: "power",
      unit: "watts",
      value: TARGET_BAND.POWER_W,
      min: TARGET_BAND.POWER_LOW_W,
      max: TARGET_BAND.POWER_HIGH_W,
    },
    {
      type: "heart_rate",
      unit: "bpm",
      value: TARGET_BAND.HR_BPM,
      min: TARGET_BAND.HR_LOW_BPM,
      max: TARGET_BAND.HR_HIGH_BPM,
    },
    {
      type: "cadence",
      unit: "rpm",
      value: TARGET_BAND.CADENCE_RPM,
      min: TARGET_BAND.CADENCE_LOW_RPM,
      max: TARGET_BAND.CADENCE_HIGH_RPM,
    },
  ])(
    "should read a single $unit value back as its band range (round-trip is not exact)",
    ({ type, unit, value, min, max }) => {
      // Arrange
      const target = { type, value: { unit, value } } as Target;

      // Act
      const result = roundTrip(target);

      // Assert
      // KRD single -> Garmin band -> KRD range: the unit changes and the band
      // widens, by design, so a single value never round-trips exactly.
      expect(result.target).toEqual({
        type,
        value: { unit: "range", min, max },
      });
    }
  );

  it.each([
    { type: "power", unit: "watts", value: TARGET_BAND.POWER_SCHEMA_MAX_W },
    { type: "heart_rate", unit: "bpm", value: TARGET_BAND.SCHEMA_MAX_BPM },
    { type: "cadence", unit: "rpm", value: TARGET_BAND.SCHEMA_MAX_RPM },
  ])(
    "should keep a re-imported $unit band within the schema at its max (round-trip)",
    ({ type, unit, value }) => {
      // Arrange
      const target = { type, value: { unit, value } } as Target;

      // Act
      const result = roundTrip(target);

      // Assert
      expect(targetSchema.safeParse(result.target).success).toBe(true);
    }
  );
});
