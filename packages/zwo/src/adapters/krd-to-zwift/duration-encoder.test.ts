/* eslint-disable no-magic-numbers -- test fixtures use literal seconds/meters values for clarity */
import type { WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { encodeDuration } from "./duration-encoder";

const makeStep = (duration: WorkoutStep["duration"]): WorkoutStep => ({
  stepIndex: 2,
  durationType: duration.type,
  duration,
  targetType: "open",
  target: { type: "open" },
});

describe("encodeDuration", () => {
  it("should encode time duration as @_Duration seconds", () => {
    // Arrange
    const step = makeStep({ type: "time", seconds: 300 });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(300);
  });

  it("should encode distance duration as @_Duration meters with lossy metadata", () => {
    // Arrange
    const step = makeStep({ type: "distance", meters: 1000 });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(1000);
    expect(interval["@_kaiord:originalDurationType"]).toBe("distance");
    expect(interval["@_kaiord:originalDurationMeters"]).toBe(1000);
  });

  it("should emit logger warn for distance duration", () => {
    // Arrange
    const step = makeStep({ type: "distance", meters: 500 });
    const interval: Record<string, unknown> = {};
    const logger = createMockLogger();
    const warnSpy = vi.spyOn(logger, "warn");

    // Act
    encodeDuration(step, interval, logger);

    // Assert
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      "Lossy conversion: distance duration converted to time",
      expect.objectContaining({ originalMeters: 500, stepIndex: 2 }),
    );
  });

  it("should encode open duration as @_Duration zero", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(0);
  });

  it("should encode heart_rate_less_than duration as 300 second fallback with bpm metadata", () => {
    // Arrange
    const step = makeStep({ type: "heart_rate_less_than", bpm: 140 });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(300);
    expect(interval["@_kaiord:originalDurationType"]).toBe("heart_rate_less_than");
    expect(interval["@_kaiord:originalDurationBpm"]).toBe(140);
  });

  it("should encode power_less_than duration as 300 second fallback with watts metadata", () => {
    // Arrange
    const step = makeStep({ type: "power_less_than", watts: 200 });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(300);
    expect(interval["@_kaiord:originalDurationType"]).toBe("power_less_than");
    expect(interval["@_kaiord:originalDurationWatts"]).toBe(200);
  });

  it("should encode power_greater_than duration as 300 second fallback with watts metadata", () => {
    // Arrange
    const step = makeStep({ type: "power_greater_than", watts: 300 });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(300);
    expect(interval["@_kaiord:originalDurationType"]).toBe("power_greater_than");
    expect(interval["@_kaiord:originalDurationWatts"]).toBe(300);
  });

  it("should emit logger warn for unsupported duration type", () => {
    // Arrange
    const step = makeStep({ type: "heart_rate_less_than", bpm: 150 });
    const interval: Record<string, unknown> = {};
    const logger = createMockLogger();
    const warnSpy = vi.spyOn(logger, "warn");

    // Act
    encodeDuration(step, interval, logger);

    // Assert
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      "Lossy conversion: unsupported duration type",
      expect.objectContaining({ originalType: "heart_rate_less_than", fallbackSeconds: 300 }),
    );
  });

  it("should not emit warning when no logger provided", () => {
    // Arrange
    const step = makeStep({ type: "distance", meters: 800 });
    const interval: Record<string, unknown> = {};

    // Act & Assert
    expect(() => encodeDuration(step, interval)).not.toThrow();
  });

  it.each([
    [60, 60],
    [300, 300],
    [3600, 3600],
  ] as const)("should encode time duration of %i seconds", (seconds, expected) => {
    // Arrange
    const step = makeStep({ type: "time", seconds });
    const interval: Record<string, unknown> = {};

    // Act
    encodeDuration(step, interval);

    // Assert
    expect(interval["@_Duration"]).toBe(expected);
  });
});
