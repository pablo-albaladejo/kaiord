import { describe, expect, it } from "vitest";

import { convertTcxDuration } from "./tcx-to-krd.converter";

describe("convertTcxDuration (tcx-to-krd.converter)", () => {
  it("should convert Time duration with seconds", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Time",
      seconds: 300,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 300 },
    });
  });

  it("should convert Distance duration with meters", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Distance",
      meters: 1000,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1000 },
    });
  });

  it("should convert LapButton to open", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "LapButton",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should convert HeartRateAbove with bpm to extensions", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "HeartRateAbove",
      bpm: 160,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 160 },
    });
  });

  it("should convert HeartRateBelow with bpm to extensions", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "HeartRateBelow",
      bpm: 120,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateBelow: 120 },
    });
  });

  it("should convert CaloriesBurned with calories to extensions", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
      calories: 500,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 500 },
    });
  });

  it("should return open for invalid duration type", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "InvalidType",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for missing duration type", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({});

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for Time without seconds (falls through standard)", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Time",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for Distance without meters", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Distance",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for HeartRateAbove without bpm", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "HeartRateAbove",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return open for CaloriesBurned without calories", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should handle zero seconds for Time", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Time",
      seconds: 0,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 0 },
    });
  });

  it("should handle fractional meters for Distance", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "Distance",
      meters: 1609.34,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1609.34 },
    });
  });

  it("should handle large calorie values", () => {
    // Arrange

    // Act
    const result = convertTcxDuration({
      durationType: "CaloriesBurned",
      calories: 2000,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 2000 },
    });
  });
});
