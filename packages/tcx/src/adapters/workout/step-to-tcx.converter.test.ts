import type { Logger, WorkoutStep } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { STEP_ID_FIVE, STEP_INDEX_FOUR } from "../../test-utils/constants";
import { convertStepToTcx } from "./step-to-tcx.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createWorkoutStep = (
  overrides: Partial<WorkoutStep> = {}
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

describe("convertStepToTcx", () => {
  it("should convert a basic step with time duration", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep();

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result["@_xsi:type"]).toBe("Step_t");
    expect(result.StepId).toBe(1);
    expect(result.Duration).toStrictEqual({
      "@_xsi:type": "Time_t",
      Seconds: 300,
    });
    expect(result.Target).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should set correct StepId from index", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep();

    // Act
    const result = convertStepToTcx(step, STEP_INDEX_FOUR, "generic", logger);

    // Assert
    expect(result.StepId).toBe(STEP_ID_FIVE);
  });

  it("should include step name when present", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ name: "Warm Up" });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Name).toBe("Warm Up");
  });

  it("should not include Name when step name is undefined", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ name: undefined });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Name).toBeUndefined();
  });

  it("should capitalize intensity", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ intensity: "warmup" });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Intensity).toBe("Warmup");
  });

  it("should capitalize active intensity", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ intensity: "active" });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Intensity).toBe("Active");
  });

  it("should not include Intensity when undefined", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ intensity: undefined });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Intensity).toBeUndefined();
  });

  it("should restore TCX extensions from step extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({
      extensions: {
        tcx: { TPX: { Watts: 250 } },
      },
    });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Extensions).toStrictEqual({ TPX: { Watts: 250 } });
    expect(logger.debug).toHaveBeenCalledWith(
      "Restoring step-level TCX extensions",
      expect.objectContaining({ stepIndex: 0 })
    );
  });

  it("should add power extensions when target is power with watts", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({
      target: {
        type: "power",
        value: { unit: "watts", value: 250 },
      },
      targetType: "power",
    });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Extensions).toStrictEqual({
      TPX: {
        "@_xmlns": "http://www.garmin.com/xmlschemas/ActivityExtension/v2",
        Watts: 250,
      },
    });
  });

  it("should not add power extensions for non-power targets", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      },
      targetType: "heart_rate",
    });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Extensions).toBeUndefined();
  });

  it("should log debug messages during conversion", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({ stepIndex: 2 });

    // Act
    convertStepToTcx(step, 2, "generic", logger);

    // Assert
    expect(logger.debug).toHaveBeenCalledWith("Converting step to TCX", {
      stepIndex: 2,
    });
  });

  it("should handle distance duration", () => {
    // Arrange
    const logger = createMockLogger();
    const step = createWorkoutStep({
      durationType: "distance",
      duration: { type: "distance", meters: 1000 },
    });

    // Act
    const result = convertStepToTcx(step, 0, "generic", logger);

    // Assert
    expect(result.Duration).toStrictEqual({
      "@_xsi:type": "Distance_t",
      Meters: 1000,
    });
  });
});
