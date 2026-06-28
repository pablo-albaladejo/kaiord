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
  it.each([
    [DURATION_SECONDS.FIVE_MIN],
    [DURATION_SECONDS.TWO_MIN_DECIMAL],
  ] as const)(
    "should convert positive seconds %s to a time duration",
    (seconds) => {
      // Arrange

      // Act
      const result = convertZwiftTimeDuration(seconds);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.time,
        seconds,
      });
    }
  );

  it.each([[0], [DURATION_SECONDS.NEG_TEN]] as const)(
    "should return open duration for non-positive seconds %s",
    (seconds) => {
      // Arrange

      // Act
      const result = convertZwiftTimeDuration(seconds);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    }
  );
});

describe("convertZwiftDistanceDuration", () => {
  it.each([
    [DISTANCE_METERS.ONE_KM],
    [DISTANCE_METERS.HALF_KM_DECIMAL],
  ] as const)(
    "should convert positive meters %s to a distance duration",
    (meters) => {
      // Arrange

      // Act
      const result = convertZwiftDistanceDuration(meters);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.distance,
        meters,
      });
    }
  );

  it.each([[0], [DISTANCE_METERS.NEG_HUNDRED]] as const)(
    "should return open duration for non-positive meters %s",
    (meters) => {
      // Arrange

      // Act
      const result = convertZwiftDistanceDuration(meters);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    }
  );
});

describe("convertZwiftDuration", () => {
  it.each([
    {
      durationValue: DURATION_SECONDS.TEN_MIN,
      isDistanceBased: false,
      expected: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.TEN_MIN,
      },
    },
    {
      durationValue: DISTANCE_METERS.TWO_KM,
      isDistanceBased: true,
      expected: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.TWO_KM,
      },
    },
  ])(
    "should convert positive value to a $expected.type duration",
    ({ durationValue, isDistanceBased, expected }) => {
      // Arrange

      // Act
      const result = convertZwiftDuration(durationValue, isDistanceBased);

      // Assert
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    { durationValue: undefined, isDistanceBased: false },
    { durationValue: 0, isDistanceBased: false },
    { durationValue: DURATION_SECONDS.NEG_FIFTY, isDistanceBased: true },
  ])(
    "should return open duration for non-positive value $durationValue",
    ({ durationValue, isDistanceBased }) => {
      // Arrange

      // Act
      const result = convertZwiftDuration(durationValue, isDistanceBased);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    }
  );
});

describe("convertKrdTimeDurationToZwift", () => {
  it.each([
    {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.FIVE_MIN,
      },
      expected: DURATION_SECONDS.FIVE_MIN,
    },
    {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.TWO_MIN_DECIMAL,
      },
      expected: DURATION_SECONDS.TWO_MIN_DECIMAL,
    },
  ])(
    "should convert time duration to $expected seconds",
    ({ duration, expected }) => {
      // Arrange

      // Act
      const result = convertKrdTimeDurationToZwift(duration);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it.each([
    {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.ONE_KM,
      },
    },
    { duration: { type: durationTypeSchema.enum.open } },
  ])(
    "should return 0 for a non-time $duration.type duration",
    ({ duration }) => {
      // Arrange

      // Act
      const result = convertKrdTimeDurationToZwift(duration);

      // Assert
      expect(result).toBe(0);
    }
  );
});

describe("convertKrdDistanceDurationToZwift", () => {
  it.each([
    {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.ONE_KM,
      },
      expected: DISTANCE_METERS.ONE_KM,
    },
    {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.HALF_KM_DECIMAL,
      },
      expected: DISTANCE_METERS.HALF_KM_DECIMAL,
    },
  ])(
    "should convert distance duration to $expected meters",
    ({ duration, expected }) => {
      // Arrange

      // Act
      const result = convertKrdDistanceDurationToZwift(duration);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it.each([
    {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.FIVE_MIN,
      },
    },
    { duration: { type: durationTypeSchema.enum.open } },
  ])(
    "should return 0 for a non-distance $duration.type duration",
    ({ duration }) => {
      // Arrange

      // Act
      const result = convertKrdDistanceDurationToZwift(duration);

      // Assert
      expect(result).toBe(0);
    }
  );
});

describe("convertKrdDurationToZwift", () => {
  it.each([
    {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.TEN_MIN,
      },
      isDistanceBased: false,
      expected: DURATION_SECONDS.TEN_MIN,
    },
    {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.TWO_KM,
      },
      isDistanceBased: true,
      expected: DISTANCE_METERS.TWO_KM,
    },
  ])(
    "should convert $duration.type duration to $expected when the flag matches",
    ({ duration, isDistanceBased, expected }) => {
      // Arrange

      // Act
      const result = convertKrdDurationToZwift(duration, isDistanceBased);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it.each([
    {
      duration: { type: durationTypeSchema.enum.open },
      isDistanceBased: false,
    },
    {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: DURATION_SECONDS.FIVE_MIN,
      },
      isDistanceBased: true,
    },
    {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: DISTANCE_METERS.ONE_KM,
      },
      isDistanceBased: false,
    },
  ])(
    "should return 0 for $duration.type duration when the flag mismatches",
    ({ duration, isDistanceBased }) => {
      // Arrange

      // Act
      const result = convertKrdDurationToZwift(duration, isDistanceBased);

      // Assert
      expect(result).toBe(0);
    }
  );
});
