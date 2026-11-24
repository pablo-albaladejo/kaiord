import { describe, expect, it } from "vitest";

import { convertStandardTcxDuration } from "./duration-standard-converter";

describe("convertStandardTcxDuration", () => {
  it("should convert Time_t to time duration", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 300 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "time", seconds: 300 });
  });

  it("should convert Distance_t to distance duration", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1000 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "distance", meters: 1000 });
  });

  it("should convert LapButton_t to open duration", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "LapButton_t" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  it("should convert UserInitiated_t, the TCX lap button, to an open duration", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "UserInitiated_t" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  it("should convert CaloriesBurned_t to a calories duration", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "CaloriesBurned_t", Calories: 100 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "calories", calories: 100 });
  });

  it("should convert HeartRateBelow_t in beats per minute to a heart_rate_less_than duration", () => {
    // Arrange
    const tcxDuration = {
      "@_xsi:type": "HeartRateBelow_t",
      HeartRate: { "@_xsi:type": "HeartRateInBeatsPerMinute_t", Value: 120 },
    };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 120 });
  });

  it("should not read HeartRateBelow_t as a share of maximum, which a KRD bpm end cannot hold", () => {
    // Arrange
    const tcxDuration = {
      "@_xsi:type": "HeartRateBelow_t",
      HeartRate: { "@_xsi:type": "HeartRateAsPercentOfMax_t", Value: 70 },
    };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for unknown duration type", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "HeartRateAbove_t" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for missing duration type", () => {
    // Arrange
    const tcxDuration = { Seconds: 300 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Time_t with non-number Seconds", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: "300" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Time_t with zero seconds", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 0 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Distance_t with non-number Meters", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: "1000" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Distance_t with zero meters", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 0 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });
});
