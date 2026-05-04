import { describe, expect, it } from "vitest";

import type { TcxDurationType } from "../schemas/tcx-duration";
import { convertExtendedDuration } from "./extended-duration.converter";

describe("convertExtendedDuration", () => {
  it("should convert HeartRateAbove with bpm", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 160 }
    );

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 160 },
    });
  });

  it("should convert HeartRateBelow with bpm", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "HeartRateBelow" as TcxDurationType,
      { bpm: 120 }
    );

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateBelow: 120 },
    });
  });

  it("should convert CaloriesBurned with calories", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      { calories: 500 }
    );

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 500 },
    });
  });

  it("should return null for HeartRateAbove without bpm", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      {}
    );

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for HeartRateBelow without bpm", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "HeartRateBelow" as TcxDurationType,
      {}
    );

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for CaloriesBurned without calories", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      {}
    );

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for standard duration type Time", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration("Time" as TcxDurationType, {
      seconds: 300,
    });

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for standard duration type Distance", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration("Distance" as TcxDurationType, {
      meters: 1000,
    });

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for LapButton", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration("LapButton" as TcxDurationType, {});

    // Assert
    expect(result).toBeNull();
  });

  it("should handle large bpm value for HeartRateAbove", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 200 }
    );

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { heartRateAbove: 200 },
    });
  });

  it("should handle large calorie value", () => {
    // Arrange

    // Act
    const result = convertExtendedDuration(
      "CaloriesBurned" as TcxDurationType,
      { calories: 2000 }
    );

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
      extensions: { caloriesBurned: 2000 },
    });
  });
});
