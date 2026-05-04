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

  it("should handle large time values", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 7200 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "time", seconds: 7200 });
  });

  it("should handle fractional meters", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1609.34 };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toStrictEqual({ type: "distance", meters: 1609.34 });
  });

  it("should return null for Time_t without Seconds property", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Time_t" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Distance_t without Meters property", () => {
    // Arrange
    const tcxDuration = { "@_xsi:type": "Distance_t" };

    // Act
    const result = convertStandardTcxDuration(tcxDuration);

    // Assert
    expect(result).toBeNull();
  });
});
