import { describe, expect, it } from "vitest";

import {
  LENGTH_DECIMAL_METERS,
  LENGTH_UNIT_YARDS_25_AS_METERS,
  LENGTH_UNIT_YARDS_27_5_AS_METERS,
  LENGTH_UNIT_YARDS_50_AS_METERS,
  POOL_LENGTH_25,
  POOL_LENGTH_50,
} from "../../test-utils/tolerance-constants";
import { convertLengthToMeters } from "./length-unit.converter";

const YARDS_DECIMAL_LENGTH = 27.5;

describe("convertLengthToMeters", () => {
  it.each([
    [POOL_LENGTH_25, LENGTH_UNIT_YARDS_25_AS_METERS],
    [POOL_LENGTH_50, LENGTH_UNIT_YARDS_50_AS_METERS],
    [YARDS_DECIMAL_LENGTH, LENGTH_UNIT_YARDS_27_5_AS_METERS],
  ])("should convert %p yards to meters", (length, expected) => {
    // Arrange
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(expected, 2);
  });

  it.each([POOL_LENGTH_25, LENGTH_DECIMAL_METERS])(
    "should return %p unchanged when unit is meters",
    (length) => {
      // Arrange
      const unit = "meters" as const;

      // Act
      const result = convertLengthToMeters(length, unit);

      // Assert
      expect(result).toBe(length);
    }
  );
});
