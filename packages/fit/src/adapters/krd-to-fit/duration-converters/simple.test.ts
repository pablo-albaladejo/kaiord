import { describe, expect, it } from "vitest";

import { convertSimpleDuration } from "./simple";

describe("convertSimpleDuration", () => {
  it("should convert a time duration with milliseconds value", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertSimpleDuration(
      { type: "time", seconds: 300 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "time",
      durationTime: 300,
      durationValue: 300000,
    });
  });

  it("should convert a distance duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertSimpleDuration(
      { type: "distance", meters: 1000 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "distance",
      durationDistance: 1000,
    });
  });

  it("should convert a calories duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertSimpleDuration(
      { type: "calories", calories: 250 },
      message
    );

    // Assert
    expect(handled).toBe(true);
    expect(message).toStrictEqual({
      durationType: "calories",
      durationCalories: 250,
    });
  });

  it("should leave the message untouched for a non-simple duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};

    // Act
    const handled = convertSimpleDuration({ type: "open" }, message);

    // Assert
    expect(handled).toBe(false);
    expect(message).toStrictEqual({});
  });
});
