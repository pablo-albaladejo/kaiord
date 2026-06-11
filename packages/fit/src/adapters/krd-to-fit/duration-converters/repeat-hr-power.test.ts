import { describe, expect, it } from "vitest";

import { convertRepeatHrPowerDuration } from "./repeat-hr-power";

describe("convertRepeatHrPowerDuration", () => {
  it("should convert a repeat until heart rate greater than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatHrPowerDuration(
      { type: "repeat_until_heart_rate_greater_than", bpm: 160, repeatFrom: 1 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilHrGreaterThan",
      durationHr: 160,
      durationStep: 1,
    });
  });

  it("should convert a repeat until heart rate less than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatHrPowerDuration(
      { type: "repeat_until_heart_rate_less_than", bpm: 120, repeatFrom: 0 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilHrLessThan",
      durationHr: 120,
      durationStep: 0,
    });
  });

  it("should convert a repeat until power less than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatHrPowerDuration(
      { type: "repeat_until_power_less_than", watts: 180, repeatFrom: 3 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilPowerLessThan",
      durationPower: 180,
      durationStep: 3,
    });
  });

  it("should convert a repeat until power greater than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatHrPowerDuration(
      { type: "repeat_until_power_greater_than", watts: 320, repeatFrom: 2 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilPowerGreaterThan",
      durationPower: 320,
      durationStep: 2,
    });
  });

  it("should leave the message untouched for a non-repeat duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatHrPowerDuration(
      { type: "time", seconds: 60 },
      message
    );

    // Assert
    expect(handled).toBe(false);
    expect(message).toStrictEqual({});
  });
});
