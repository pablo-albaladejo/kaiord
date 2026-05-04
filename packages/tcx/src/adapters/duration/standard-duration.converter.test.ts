import { describe, expect, it } from "vitest";

import type { TcxDurationType } from "../schemas/tcx-duration";
import { convertStandardDuration } from "./standard-duration.converter";

describe("convertStandardDuration", () => {
  it("should convert Time duration with seconds", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Time" as TcxDurationType, {
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
    const result = convertStandardDuration("Distance" as TcxDurationType, {
      meters: 1000,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 1000 },
    });
  });

  it("should convert LapButton duration to open", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("LapButton" as TcxDurationType, {});

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "open" },
    });
  });

  it("should return null for Time without seconds", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Time" as TcxDurationType, {});

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for Distance without meters", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Distance" as TcxDurationType, {});

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for HeartRateAbove (not standard)", () => {
    // Arrange

    // Act
    const result = convertStandardDuration(
      "HeartRateAbove" as TcxDurationType,
      { bpm: 160 }
    );

    // Assert
    expect(result).toBeNull();
  });

  it("should handle fractional seconds", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Time" as TcxDurationType, {
      seconds: 90.5,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 90.5 },
    });
  });

  it("should handle zero seconds", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Time" as TcxDurationType, {
      seconds: 0,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "time", seconds: 0 },
    });
  });

  it("should handle zero meters", () => {
    // Arrange

    // Act
    const result = convertStandardDuration("Distance" as TcxDurationType, {
      meters: 0,
    });

    // Assert
    expect(result).toStrictEqual({
      duration: { type: "distance", meters: 0 },
    });
  });
});
