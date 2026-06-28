import { describe, expect, it } from "vitest";

import { POWER_W } from "../../test-utils/constants";
import { convertGarminTargetToKrd } from "./target-from-garmin.converter";

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
