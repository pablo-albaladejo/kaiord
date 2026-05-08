import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import {
  DISTANCE_METERS_1000,
  DISTANCE_METERS_MILE,
  TIME_SECONDS_300,
  TIME_SECONDS_7200,
} from "../../test-utils/constants";
import {
  convertTcxDuration,
  mapDistanceDurationToTcx,
  mapOpenDurationToTcx,
  mapTimeDurationToTcx,
} from "./duration-walker.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxDuration (mapper)", () => {
  it("should return null for undefined input", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = convertTcxDuration(undefined, logger);

    // Assert
    expect(result).toBeNull();
  });

  it("should convert Time_t to time duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 300 };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "time", seconds: 300 });
  });

  it("should convert Distance_t to distance duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1000 };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "distance", meters: 1000 });
  });

  it("should convert LapButton_t to open duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "LapButton_t" };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "open" });
  });

  it("should restore kaiord heart_rate_less_than duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": 140,
    };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 140 });
  });

  it("should restore kaiord power_less_than duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 200,
    };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "power_less_than", watts: 200 });
  });

  it("should restore kaiord calories duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": 500,
    };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "calories", calories: 500 });
  });

  it("should prioritize kaiord restoration over standard conversion", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "Time_t",
      Seconds: 300,
      "@_kaiord:originalDurationType": "power_greater_than",
      "@_kaiord:originalDurationWatts": 250,
    };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "power_greater_than", watts: 250 });
  });

  it("should log warning for unsupported duration type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "HeartRateAbove_t" };

    // Act
    convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith("Unsupported duration type", {
      durationType: "HeartRateAbove_t",
    });
  });

  it("should return null for unsupported duration type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "CaloriesBurned_t" };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
  });
});

describe("mapTimeDurationToTcx", () => {
  it("should create Time_t element", () => {
    // Arrange

    // Act
    const result = mapTimeDurationToTcx(TIME_SECONDS_300);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 300,
    });
  });

  it("should handle large time values", () => {
    // Arrange

    // Act
    const result = mapTimeDurationToTcx(TIME_SECONDS_7200);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 7200,
    });
  });
});

describe("mapDistanceDurationToTcx", () => {
  it("should create Distance_t element", () => {
    // Arrange

    // Act
    const result = mapDistanceDurationToTcx(DISTANCE_METERS_1000);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1000,
    });
  });

  it("should handle fractional meters", () => {
    // Arrange

    // Act
    const result = mapDistanceDurationToTcx(DISTANCE_METERS_MILE);

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1609.34,
    });
  });
});

describe("mapOpenDurationToTcx", () => {
  it("should create LapButton_t element", () => {
    // Arrange

    // Act
    const result = mapOpenDurationToTcx();

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
    });
  });
});
