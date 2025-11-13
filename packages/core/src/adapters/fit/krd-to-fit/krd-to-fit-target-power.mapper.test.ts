import { describe, expect, it } from "vitest";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { convertPowerTarget } from "./krd-to-fit-target-power.mapper";

describe("convertPowerTarget", () => {
  it("should convert power zone target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "zone", value: 4 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertPowerTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "power",
      targetPowerZone: 4,
    });
  });

  it("should convert power range target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertPowerTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "power",
      targetValue: 0,
      customTargetPowerLow: 200,
      customTargetPowerHigh: 250,
    });
  });

  it("should convert power watts target with offset", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 250 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertPowerTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "power",
      targetValue: 1250,
    });
  });

  it("should convert power percent FTP target", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "percent_ftp", value: 85 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertPowerTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "power",
      targetValue: 85,
    });
  });

  it("should not modify message when target type is not power", () => {
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
    convertPowerTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "power",
    });
  });
});
