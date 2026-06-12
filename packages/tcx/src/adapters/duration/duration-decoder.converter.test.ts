import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { convertTcxDuration } from "./duration-decoder.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxDuration", () => {
  it("should return null when the step has no duration element", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const result = convertTcxDuration(undefined, logger);

    // Assert
    expect(result).toBeNull();
  });

  it("should route standard TCX durations through the standard converter", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 300 };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "time", seconds: 300 });
  });

  it("should restore kaiord-extended durations from kaiord attributes", () => {
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

  it("should warn and return null for unsupported duration types", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "HeartRateAbove_t" };

    // Act
    const result = convertTcxDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("Unsupported duration type", {
      durationType: "HeartRateAbove_t",
    });
  });
});
