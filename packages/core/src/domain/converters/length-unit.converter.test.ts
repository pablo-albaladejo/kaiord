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

describe("convertLengthToMeters", () => {
  it("should return length unchanged when unit is meters", () => {
    // Arrange
    const length = POOL_LENGTH_25;
    const unit = "meters" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBe(POOL_LENGTH_25);
  });

  it("should convert yards to meters", () => {
    // Arrange
    const length = POOL_LENGTH_25;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(LENGTH_UNIT_YARDS_25_AS_METERS, 2);
  });

  it("should convert 50 yards to meters", () => {
    // Arrange
    const length = POOL_LENGTH_50;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(LENGTH_UNIT_YARDS_50_AS_METERS, 2);
  });

  it("should handle decimal lengths in meters", () => {
    // Arrange
    const length = LENGTH_DECIMAL_METERS;
    const unit = "meters" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBe(LENGTH_DECIMAL_METERS);
  });

  it("should handle decimal lengths in yards", () => {
    // Arrange
    const length = 27.5;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(LENGTH_UNIT_YARDS_27_5_AS_METERS, 2);
  });
});
