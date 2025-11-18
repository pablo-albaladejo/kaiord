import { describe, expect, it } from "vitest";
import { durationTypeSchema } from "../../../domain/schemas/duration";
import {
  convertKrdDistanceDurationToZwift,
  convertKrdDurationToZwift,
  convertKrdTimeDurationToZwift,
  convertZwiftDistanceDuration,
  convertZwiftDuration,
  convertZwiftTimeDuration,
} from "./duration.converter";

describe("convertZwiftTimeDuration", () => {
  it("should convert positive seconds to time duration", () => {
    // Arrange
    const seconds = 300;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: 300,
    });
  });

  it("should convert decimal seconds to time duration", () => {
    // Arrange
    const seconds = 120.5;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: 120.5,
    });
  });

  it("should return open duration when seconds is zero", () => {
    // Arrange
    const seconds = 0;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });

  it("should return open duration when seconds is negative", () => {
    // Arrange
    const seconds = -10;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });
});

describe("convertZwiftDistanceDuration", () => {
  it("should convert positive meters to distance duration", () => {
    // Arrange
    const meters = 1000;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: 1000,
    });
  });

  it("should convert decimal meters to distance duration", () => {
    // Arrange
    const meters = 500.5;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: 500.5,
    });
  });

  it("should return open duration when meters is zero", () => {
    // Arrange
    const meters = 0;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });

  it("should return open duration when meters is negative", () => {
    // Arrange
    const meters = -100;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });
});

describe("convertZwiftDuration", () => {
  it("should convert time-based duration when not distance-based", () => {
    // Arrange
    const durationValue = 600;
    const isDistanceBased = false;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: 600,
    });
  });

  it("should convert distance-based duration when distance-based", () => {
    // Arrange
    const durationValue = 2000;
    const isDistanceBased = true;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: 2000,
    });
  });

  it("should return open duration when value is undefined", () => {
    // Arrange
    const durationValue = undefined;
    const isDistanceBased = false;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });

  it("should return open duration when value is zero", () => {
    // Arrange
    const durationValue = 0;
    const isDistanceBased = false;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });

  it("should return open duration when value is negative", () => {
    // Arrange
    const durationValue = -50;
    const isDistanceBased = true;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.open,
    });
  });
});

describe("convertKrdTimeDurationToZwift", () => {
  it("should convert time duration to seconds", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: 300,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(300);
  });

  it("should convert decimal seconds", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: 120.5,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(120.5);
  });

  it("should return 0 for distance duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: 1000,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(0);
  });

  it("should return 0 for open duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.open,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(0);
  });
});

describe("convertKrdDistanceDurationToZwift", () => {
  it("should convert distance duration to meters", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: 1000,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(1000);
  });

  it("should convert decimal meters", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: 500.5,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(500.5);
  });

  it("should return 0 for time duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: 300,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(0);
  });

  it("should return 0 for open duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.open,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(0);
  });
});

describe("convertKrdDurationToZwift", () => {
  it("should convert time duration when not distance-based", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: 600,
    };
    const isDistanceBased = false;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(600);
  });

  it("should convert distance duration when distance-based", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: 2000,
    };
    const isDistanceBased = true;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(2000);
  });

  it("should return 0 for open duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.open,
    };
    const isDistanceBased = false;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(0);
  });

  it("should return 0 when time duration used with distance-based flag", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: 300,
    };
    const isDistanceBased = true;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(0);
  });

  it("should return 0 when distance duration used without distance-based flag", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: 1000,
    };
    const isDistanceBased = false;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(0);
  });
});
