import { describe, expect, it } from "vitest";
import { convertLengthToMeters } from "./length-unit.converter";

describe("convertLengthToMeters", () => {
  it("should return length unchanged when unit is meters", () => {
    // Arrange
    const length = 25;
    const unit = "meters" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBe(25);
  });

  it("should convert yards to meters", () => {
    // Arrange
    const length = 25;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(22.86, 2);
  });

  it("should convert 50 yards to meters", () => {
    // Arrange
    const length = 50;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(45.72, 2);
  });

  it("should handle decimal lengths in meters", () => {
    // Arrange
    const length = 33.33;
    const unit = "meters" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBe(33.33);
  });

  it("should handle decimal lengths in yards", () => {
    // Arrange
    const length = 27.5;
    const unit = "yards" as const;

    // Act
    const result = convertLengthToMeters(length, unit);

    // Assert
    expect(result).toBeCloseTo(25.146, 2);
  });
});
