import { describe, expect, it } from "vitest";

import { convertDurationToTcx } from "./duration-to-tcx-encoder";

describe("convertDurationToTcx", () => {
  it("should convert time duration to Time_t", () => {
    // Arrange
    const step = {
      duration: { type: "time" as const, seconds: 300 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 300,
    });
  });

  it("should convert distance duration to Distance_t", () => {
    // Arrange
    const step = {
      duration: { type: "distance" as const, meters: 1000 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1000,
    });
  });

  it("should convert open duration to LapButton_t", () => {
    // Arrange
    const step = {
      duration: { type: "open" as const },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
    });
  });

  it.each([
    {
      duration: { type: "heart_rate_less_than" as const, bpm: 140 },
      expected: {
        "@_xsi:type": "LapButton_t",
        "@_kaiord:originalDurationType": "heart_rate_less_than",
        "@_kaiord:originalDurationBpm": 140,
      },
    },
    {
      duration: { type: "power_less_than" as const, watts: 200 },
      expected: {
        "@_xsi:type": "LapButton_t",
        "@_kaiord:originalDurationType": "power_less_than",
        "@_kaiord:originalDurationWatts": 200,
      },
    },
    {
      duration: { type: "power_greater_than" as const, watts: 250 },
      expected: {
        "@_xsi:type": "LapButton_t",
        "@_kaiord:originalDurationType": "power_greater_than",
        "@_kaiord:originalDurationWatts": 250,
      },
    },
    {
      duration: { type: "calories" as const, calories: 500 },
      expected: {
        "@_xsi:type": "LapButton_t",
        "@_kaiord:originalDurationType": "calories",
        "@_kaiord:originalDurationCalories": 500,
      },
    },
  ])(
    "should add kaiord attributes for $duration.type",
    ({ duration, expected }) => {
      // Arrange
      const step = { duration };

      // Act
      const result = convertDurationToTcx(step);

      // Assert
      expect(result).toStrictEqual(expected);
    }
  );

  it("should not add kaiord attributes for heart_rate_less_than without bpm", () => {
    // Arrange
    const step = {
      duration: { type: "heart_rate_less_than" as const },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
    });
  });
});
