import { describe, expect, it } from "vitest";

import { convertRepeatDuration } from "./repeat";

describe("convertRepeatDuration", () => {
  it("should convert a repeat until time duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatDuration(
      { type: "repeat_until_time", seconds: 600, repeatFrom: 2 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilTime",
      durationTime: 600,
      durationStep: 2,
    });
  });

  it("should convert a repeat until distance duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatDuration(
      { type: "repeat_until_distance", meters: 5000, repeatFrom: 0 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilDistance",
      durationDistance: 5000,
      durationStep: 0,
    });
  });

  it("should convert a repeat until calories duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatDuration(
      { type: "repeat_until_calories", calories: 400, repeatFrom: 1 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "repeatUntilCalories",
      durationCalories: 400,
      durationStep: 1,
    });
  });

  it("should leave the message untouched for a non-repeat duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertRepeatDuration(
      { type: "distance", meters: 400 },
      message
    );

    // Assert
    expect(handled).toBe(false);
    expect(message).toStrictEqual({});
  });
});
