import { describe, expect, it } from "vitest";

import { POWER_W } from "../../test-utils/constants";
import { convertGarminTargetToKrd } from "./target-from-garmin.converter";

describe("convertGarminTargetToKrd range normalization", () => {
  it("should normalize a slower-first pace range into [min, max]", () => {
    // Arrange
    const slowerFirstOne = 3.57;
    const fasterSecondTwo = 3.7;

    // Act
    const result = convertGarminTargetToKrd(
      "pace.zone",
      slowerFirstOne,
      fasterSecondTwo,
      null
    );

    // Assert
    expect(result.targetType).toBe("pace");
    expect(result.target).toEqual({
      type: "pace",
      value: { unit: "range", min: 3.57, max: 3.7 },
    });
  });

  it("should normalize a faster-first pace range into [min, max]", () => {
    // Arrange
    const fasterFirstOne = 3.7;
    const slowerSecondTwo = 3.57;

    // Act
    const result = convertGarminTargetToKrd(
      "pace.zone",
      fasterFirstOne,
      slowerSecondTwo,
      null
    );

    // Assert
    expect(result.target).toEqual({
      type: "pace",
      value: { unit: "range", min: 3.57, max: 3.7 },
    });
  });

  it("should normalize a higher-first power range into [min, max]", () => {
    // Arrange
    const higherFirstOne = POWER_W.RANGE_HIGH;
    const lowerSecondTwo = POWER_W.RANGE_LOW;

    // Act
    const result = convertGarminTargetToKrd(
      "power.zone",
      higherFirstOne,
      lowerSecondTwo,
      null
    );

    // Assert
    expect(result.target).toEqual({
      type: "power",
      value: {
        unit: "range",
        min: POWER_W.RANGE_LOW,
        max: POWER_W.RANGE_HIGH,
      },
    });
  });
});
