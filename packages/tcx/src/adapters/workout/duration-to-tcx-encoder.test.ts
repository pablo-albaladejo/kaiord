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

  it("should add kaiord attributes for heart_rate_less_than", () => {
    // Arrange
    const step = {
      duration: { type: "heart_rate_less_than" as const, bpm: 140 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": 140,
    });
  });

  it("should add kaiord attributes for power_less_than", () => {
    // Arrange
    const step = {
      duration: { type: "power_less_than" as const, watts: 200 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 200,
    });
  });

  it("should add kaiord attributes for power_greater_than", () => {
    // Arrange
    const step = {
      duration: { type: "power_greater_than" as const, watts: 250 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "power_greater_than",
      "@_kaiord:originalDurationWatts": 250,
    });
  });

  it("should add kaiord attributes for calories", () => {
    // Arrange
    const step = {
      duration: { type: "calories" as const, calories: 500 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": 500,
    });
  });

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

  it("should handle large time values", () => {
    // Arrange
    const step = {
      duration: { type: "time" as const, seconds: 7200 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 7200,
    });
  });

  it("should handle fractional distance values", () => {
    // Arrange
    const step = {
      duration: { type: "distance" as const, meters: 1609.34 },
    };

    // Act
    const result = convertDurationToTcx(step);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1609.34,
    });
  });
});
