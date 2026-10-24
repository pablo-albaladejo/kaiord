import { KrdValidationError, MissingMaxHeartRateError } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { MAX_HR_RESOLUTION as H } from "../../test-utils/constants";
import { resolvePercentMaxToBpm } from "./target-heart-rate.converter";

describe("resolvePercentMaxToBpm", () => {
  it("should resolve a percent_max value to rounded bpm with the max HR", () => {
    // Arrange
    const value = { unit: "percent_max", value: H.PCT };

    // Act
    const result = resolvePercentMaxToBpm(value, H.MAX_HR_BPM);

    // Assert
    expect(result).toEqual({ unit: "bpm", value: H.BPM });
  });

  it("should pass bpm, range and zone values through unchanged", () => {
    // Arrange
    const values = [
      { unit: "bpm", value: H.BPM },
      { unit: "range", min: H.BAND_LOW_BPM, max: H.BAND_HIGH_BPM },
      { unit: "zone", value: 2 },
    ];

    // Act
    const results = values.map((v) => resolvePercentMaxToBpm(v, undefined));

    // Assert
    expect(results).toEqual(values);
  });

  it("should keep a percent_max target without a value as an empty bpm value", () => {
    // Arrange
    const value = { unit: "percent_max" };

    // Act
    const result = resolvePercentMaxToBpm(value, H.MAX_HR_BPM);

    // Assert
    expect(result).toEqual({ unit: "bpm" });
  });

  it.each([
    undefined,
    0,
    H.NEGATIVE_MAX_HR_BPM,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    H.IMPLAUSIBLE_MAX_HR_BPM,
  ])("should throw MissingMaxHeartRateError when the max HR is %s", (maxHr) => {
    // Arrange
    const value = { unit: "percent_max", value: H.PCT };

    // Act
    const act = () => resolvePercentMaxToBpm(value, maxHr);

    // Assert
    expect(act).toThrow(MissingMaxHeartRateError);
  });

  it("should accept a max HR at the 300 bpm schema limit", () => {
    // Arrange
    const value = { unit: "percent_max", value: H.PCT };

    // Act
    const result = resolvePercentMaxToBpm(value, H.SCHEMA_MAX_BPM);

    // Assert
    expect(result.value).toBeLessThanOrEqual(H.SCHEMA_MAX_BPM);
  });

  it("should reject a percent_max target that resolves above 300 bpm instead of banding it", () => {
    // Arrange
    const value = { unit: "percent_max", value: H.OVER_HUNDRED_PCT };

    // Act
    const act = () => resolvePercentMaxToBpm(value, H.NEAR_LIMIT_MAX_HR_BPM);

    // Assert
    expect(act).toThrow(KrdValidationError);
  });
});
