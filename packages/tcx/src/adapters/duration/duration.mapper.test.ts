import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import {
  convertTcxDuration,
  mapTimeDurationToTcx,
  mapDistanceDurationToTcx,
  mapOpenDurationToTcx,
} from "./duration.mapper";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxDuration (mapper)", () => {
  it("should return null for undefined input", () => {
    const logger = createMockLogger();

    const result = convertTcxDuration(undefined, logger);

    expect(result).toBeNull();
  });

  it("should convert Time_t to time duration", () => {
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "Time_t", Seconds: 300 };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "time", seconds: 300 });
  });

  it("should convert Distance_t to distance duration", () => {
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "Distance_t", Meters: 1000 };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "distance", meters: 1000 });
  });

  it("should convert LapButton_t to open duration", () => {
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "LapButton_t" };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "open" });
  });

  it("should restore kaiord heart_rate_less_than duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "heart_rate_less_than",
      "@_kaiord:originalDurationBpm": 140,
    };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 140 });
  });

  it("should restore kaiord power_less_than duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "power_less_than",
      "@_kaiord:originalDurationWatts": 200,
    };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "power_less_than", watts: 200 });
  });

  it("should restore kaiord calories duration", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "LapButton_t",
      "@_kaiord:originalDurationType": "calories",
      "@_kaiord:originalDurationCalories": 500,
    };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "calories", calories: 500 });
  });

  it("should prioritize kaiord restoration over standard conversion", () => {
    const logger = createMockLogger();
    const tcxDuration = {
      "@_xsi:type": "Time_t",
      Seconds: 300,
      "@_kaiord:originalDurationType": "power_greater_than",
      "@_kaiord:originalDurationWatts": 250,
    };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toStrictEqual({ type: "power_greater_than", watts: 250 });
  });

  it("should log warning for unsupported duration type", () => {
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "HeartRateAbove_t" };

    convertTcxDuration(tcxDuration, logger);

    expect(logger.warn).toHaveBeenCalledWith("Unsupported duration type", {
      durationType: "HeartRateAbove_t",
    });
  });

  it("should return null for unsupported duration type", () => {
    const logger = createMockLogger();
    const tcxDuration = { "@_xsi:type": "CaloriesBurned_t" };

    const result = convertTcxDuration(tcxDuration, logger);

    expect(result).toBeNull();
  });
});

describe("mapTimeDurationToTcx", () => {
  it("should create Time_t element", () => {
    const result = mapTimeDurationToTcx(300);

    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 300,
    });
  });

  it("should handle large time values", () => {
    const result = mapTimeDurationToTcx(7200);

    expect(result).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 7200,
    });
  });
});

describe("mapDistanceDurationToTcx", () => {
  it("should create Distance_t element", () => {
    const result = mapDistanceDurationToTcx(1000);

    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1000,
    });
  });

  it("should handle fractional meters", () => {
    const result = mapDistanceDurationToTcx(1609.34);

    expect(result).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1609.34,
    });
  });
});

describe("mapOpenDurationToTcx", () => {
  it("should create LapButton_t element", () => {
    const result = mapOpenDurationToTcx();

    expect(result).toStrictEqual({
      "@_xsi:type": "LapButton_t",
    });
  });
});
