import type { Target } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { TARGET_BAND as B, ZONE } from "../../test-utils/constants";
import { convertKrdTargetToGarmin } from "./target-to-garmin.converter";

const bounds = (target: Target) => {
  const result = convertKrdTargetToGarmin(target);
  return [result.targetValueOne, result.targetValueTwo];
};

describe("convertKrdTargetToGarmin single-value bands", () => {
  it("should widen single watts by ±5 %, higher wattage first", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: B.POWER_W },
    };

    // Act
    const result = bounds(target);

    // Assert
    expect(result).toEqual([B.POWER_HIGH_W, B.POWER_LOW_W]);
  });

  it("should widen low single watts by at least ±5 W", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: B.SMALL_POWER_W },
    };

    // Act
    const result = bounds(target);

    // Assert
    expect(result).toEqual([B.SMALL_POWER_HIGH_W, B.SMALL_POWER_LOW_W]);
  });

  it("should cap the power band at the schema's 5000 W", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: B.POWER_SCHEMA_MAX_W },
    };

    // Act
    const [one] = bounds(target);

    // Assert
    expect(one).toBe(B.POWER_SCHEMA_MAX_W);
  });

  it("should widen single bpm by ±3, lower bound first", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: B.HR_BPM },
    };

    // Act
    const result = bounds(target);

    // Assert
    expect(result).toEqual([B.HR_LOW_BPM, B.HR_HIGH_BPM]);
  });

  it("should keep the heart-rate band within 0..300 bpm", () => {
    // Arrange
    const nearMax: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: B.HR_NEAR_MAX_BPM },
    };
    const nearZero: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: B.HR_NEAR_ZERO_BPM },
    };

    // Act
    const high = bounds(nearMax);
    const low = bounds(nearZero);

    // Assert
    expect(high).toEqual([B.HR_NEAR_MAX_LOW_BPM, B.SCHEMA_MAX_BPM]);
    expect(low).toEqual([0, B.HR_NEAR_ZERO_HIGH_BPM]);
  });

  it("should widen single cadence by ±3, lower bound first", () => {
    // Arrange
    const target: Target = {
      type: "cadence",
      value: { unit: "rpm", value: B.CADENCE_RPM },
    };

    // Act
    const result = bounds(target);

    // Assert
    expect(result).toEqual([B.CADENCE_LOW_RPM, B.CADENCE_HIGH_RPM]);
  });

  it("should cap the cadence band at the schema's 300 rpm", () => {
    // Arrange
    const target: Target = {
      type: "cadence",
      value: { unit: "rpm", value: B.SCHEMA_MAX_RPM },
    };

    // Act
    const [, two] = bounds(target);

    // Assert
    expect(two).toBe(B.SCHEMA_MAX_RPM);
  });

  it.each([
    { type: "power", unit: "watts" },
    { type: "heart_rate", unit: "bpm" },
    { type: "cadence", unit: "rpm" },
  ])("should keep a zero $unit value unchanged", ({ type, unit }) => {
    // Arrange
    const target = { type, value: { unit, value: 0 } } as Target;

    // Act
    const result = bounds(target);

    // Assert
    expect(result).toEqual([0, 0]);
  });

  it.each([
    { type: "power", zone: ZONE.Z3 },
    { type: "heart_rate", zone: ZONE.Z4 },
  ])("should leave a $type zone untouched", ({ type, zone }) => {
    // Arrange
    const target = { type, value: { unit: "zone", value: zone } } as Target;

    // Act
    const result = convertKrdTargetToGarmin(target);

    // Assert
    expect(result.zoneNumber).toBe(zone);
    expect(result.targetValueOne).toBeNull();
    expect(result.targetValueTwo).toBeNull();
  });
});
