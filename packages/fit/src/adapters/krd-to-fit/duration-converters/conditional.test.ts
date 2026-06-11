import { describe, expect, it } from "vitest";

import { convertConditionalDuration } from "./conditional";

describe("convertConditionalDuration", () => {
  it("should convert a heart rate less than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertConditionalDuration(
      { type: "heart_rate_less_than", bpm: 120 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "hrLessThan",
      durationHr: 120,
    });
  });

  it("should convert a power less than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertConditionalDuration(
      { type: "power_less_than", watts: 150 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "powerLessThan",
      durationPower: 150,
    });
  });

  it("should convert a power greater than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertConditionalDuration(
      { type: "power_greater_than", watts: 300 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "powerGreaterThan",
      durationPower: 300,
    });
  });

  it("should leave the message untouched for a non-conditional duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertConditionalDuration(
      { type: "time", seconds: 60 },
      message
    );

    // Assert
    expect(handled).toBe(false);
    expect(message).toStrictEqual({});
  });
});
