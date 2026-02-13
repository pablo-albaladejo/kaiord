import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { restoreKaiordDuration } from "./duration-kaiord-restorer";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("restoreKaiordDuration", () => {
  it("should restore heart_rate_less_than duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": 140,
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 140 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring heart_rate_less_than from kaiord attributes",
      { bpm: 140 }
    );
  });

  it("should restore power_less_than duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 200,
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "power_less_than", watts: 200 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring power_less_than from kaiord attributes",
      { watts: 200 }
    );
  });

  it("should restore power_greater_than duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_greater_than",
      "@_kaiord:originalDurationWatts": 250,
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "power_greater_than", watts: 250 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring power_greater_than from kaiord attributes",
      { watts: 250 }
    );
  });

  it("should restore calories duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": 500,
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "calories", calories: 500 });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring calories from kaiord attributes",
      { calories: 500 }
    );
  });

  it("should return null when no original duration type", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "Time_t",
      Seconds: 300,
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null for unknown original duration type", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "unknown_type",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null when heart_rate_less_than has no bpm", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null when power_less_than has no watts", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_less_than",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null when power_greater_than has no watts", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "power_greater_than",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null when calories has no calories value", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "calories",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });

  it("should return null when bpm is string instead of number", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": "140",
    };

    const result = restoreKaiordDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });
});
