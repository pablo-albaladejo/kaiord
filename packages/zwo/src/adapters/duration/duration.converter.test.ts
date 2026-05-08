import { durationTypeSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { DISTANCE_METERS, DURATION_SECONDS } from "../../test-utils";
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
    const seconds = DURATION_SECONDS.FIVE_MIN;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: DURATION_SECONDS.FIVE_MIN,
    });
  });

  it("should convert decimal seconds to time duration", () => {
    // Arrange
    const seconds = DURATION_SECONDS.TWO_MIN_DECIMAL;

    // Act
    const result = convertZwiftTimeDuration(seconds);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: DURATION_SECONDS.TWO_MIN_DECIMAL,
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
    const seconds = DURATION_SECONDS.NEG_TEN;

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
    const meters = DISTANCE_METERS.ONE_KM;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.ONE_KM,
    });
  });

  it("should convert decimal meters to distance duration", () => {
    // Arrange
    const meters = DISTANCE_METERS.HALF_KM_DECIMAL;

    // Act
    const result = convertZwiftDistanceDuration(meters);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.HALF_KM_DECIMAL,
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
    const meters = DISTANCE_METERS.NEG_HUNDRED;

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
    const durationValue = DURATION_SECONDS.TEN_MIN;
    const isDistanceBased = false;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.time,
      seconds: DURATION_SECONDS.TEN_MIN,
    });
  });

  it("should convert distance-based duration when distance-based", () => {
    // Arrange
    const durationValue = DISTANCE_METERS.TWO_KM;
    const isDistanceBased = true;

    // Act
    const result = convertZwiftDuration(durationValue, isDistanceBased);

    // Assert
    expect(result).toStrictEqual({
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.TWO_KM,
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
    const durationValue = DURATION_SECONDS.NEG_FIFTY;
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
      seconds: DURATION_SECONDS.FIVE_MIN,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(DURATION_SECONDS.FIVE_MIN);
  });

  it("should convert decimal seconds", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: DURATION_SECONDS.TWO_MIN_DECIMAL,
    };

    // Act
    const result = convertKrdTimeDurationToZwift(duration);

    // Assert
    expect(result).toBe(DURATION_SECONDS.TWO_MIN_DECIMAL);
  });

  it("should return 0 for distance duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.ONE_KM,
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
      meters: DISTANCE_METERS.ONE_KM,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(DISTANCE_METERS.ONE_KM);
  });

  it("should convert decimal meters", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.HALF_KM_DECIMAL,
    };

    // Act
    const result = convertKrdDistanceDurationToZwift(duration);

    // Assert
    expect(result).toBe(DISTANCE_METERS.HALF_KM_DECIMAL);
  });

  it("should return 0 for time duration", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.time,
      seconds: DURATION_SECONDS.FIVE_MIN,
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
      seconds: DURATION_SECONDS.TEN_MIN,
    };
    const isDistanceBased = false;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(DURATION_SECONDS.TEN_MIN);
  });

  it("should convert distance duration when distance-based", () => {
    // Arrange
    const duration = {
      type: durationTypeSchema.enum.distance,
      meters: DISTANCE_METERS.TWO_KM,
    };
    const isDistanceBased = true;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(DISTANCE_METERS.TWO_KM);
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
      seconds: DURATION_SECONDS.FIVE_MIN,
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
      meters: DISTANCE_METERS.ONE_KM,
    };
    const isDistanceBased = false;

    // Act
    const result = convertKrdDurationToZwift(duration, isDistanceBased);

    // Assert
    expect(result).toBe(0);
  });
});
