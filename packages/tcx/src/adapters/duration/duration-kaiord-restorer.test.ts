import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { restoreKaiordDuration } from "./duration-kaiord-restorer";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("restoreKaiordDuration", () => {
  it("should restore heart_rate_less_than duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": 140,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 140 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring heart_rate_less_than from kaiord attributes",
      { bpm: 140 }
    );
  });

  it("should restore power_less_than duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 200,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "power_less_than", watts: 200 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring power_less_than from kaiord attributes",
      { watts: 200 }
    );
  });

  it("should restore power_greater_than duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_greater_than",
      "@_kaiord:originalDurationWatts": 250,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "power_greater_than", watts: 250 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring power_greater_than from kaiord attributes",
      { watts: 250 }
    );
  });

  it("should restore calories duration", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": 500,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toStrictEqual({ type: "calories", calories: 500 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring calories from kaiord attributes",
      { calories: 500 }
    );
  });

  it("should return null when no original duration type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "Time_t",
      Seconds: 300,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for unknown original duration type", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "unknown_type",
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
  });

  it.each([["power_less_than"], ["power_greater_than"], ["calories"]] as const)(
    "should return null when %s has no threshold value",
    (originalDurationType) => {
      // Arrange
      const logger = createMockLogger();
      const tcxDuration = {
        "@_kaiord:originalDurationType": originalDurationType,
      };

      // Act
      const result = restoreKaiordDuration(tcxDuration, logger);

      // Assert
      expect(result).toBeNull();
    }
  );

  it("should return null when bpm is string instead of number", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": "140",
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
  });

  it("should warn and drop a restored threshold that is zero or negative", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 0,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: kaiord power_less_than watts attribute is not a positive finite number, dropping",
      { value: 0 }
    );
  });

  it("should warn and drop a restored threshold that is not finite", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": Number.POSITIVE_INFINITY,
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should not warn when the attribute is simply absent", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
    };

    // Act
    const result = restoreKaiordDuration(tcxDuration, logger);

    // Assert
    expect(result).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
