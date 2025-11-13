import { describe, expect, it } from "vitest";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { convertHeartRateTarget } from "./krd-to-fit-target-heart-rate.mapper";

describe("convertHeartRateTarget", () => {
  it("should convert heart rate zone target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertHeartRateTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "heartRate",
      targetHrZone: 3,
    });
  });

  it("should convert heart rate range target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "range", min: 140, max: 160 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertHeartRateTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "heartRate",
      targetValue: 0,
      customTargetHeartRateLow: 140,
      customTargetHeartRateHigh: 160,
    });
  });

  it("should convert heart rate bpm target with offset", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "bpm", value: 150 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertHeartRateTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "heartRate",
      targetValue: 250,
    });
  });

  it("should convert heart rate percent max target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "percent_max", value: 85 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertHeartRateTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "heartRate",
      targetValue: 85,
    });
  });

  it("should not modify message when target type is not heart rate", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertHeartRateTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "heartRate",
    });
  });
});
