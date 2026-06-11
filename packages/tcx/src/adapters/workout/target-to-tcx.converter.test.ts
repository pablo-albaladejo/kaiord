import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  convertHeartRateToTcx,
  convertPaceToTcx,
  convertTargetToTcx,
} from "./target-to-tcx.converter";

describe("convertHeartRateToTcx", () => {
  it("should convert zone to PredefinedHeartRateZone_t", () => {
    // Arrange

    // Act
    const result = convertHeartRateToTcx({ unit: "zone", value: 3 });

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: 3,
      },
    });
  });

  it("should convert bpm to CustomHeartRateZone_t", () => {
    // Arrange

    // Act
    const result = convertHeartRateToTcx({ unit: "bpm", value: 150 });

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: 150,
        High: 150,
      },
    });
  });

  it("should convert range to CustomHeartRateZone_t with min/max", () => {
    // Arrange

    // Act
    const result = convertHeartRateToTcx({
      unit: "range",
      min: 120,
      max: 160,
    });

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: 120,
        High: 160,
      },
    });
  });

  it("should return None_t for unsupported unit", () => {
    // Arrange

    // Act
    const result = convertHeartRateToTcx({ unit: "unknown", value: 100 });

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});

describe("convertPaceToTcx", () => {
  it("should convert a single mps pace to CustomSpeedZone_t", () => {
    // Arrange

    // Act
    const result = convertPaceToTcx({
      unit: "mps",
      value: 4.2,
    });

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 4.2,
        HighInMetersPerSecond: 4.2,
      },
    });
  });

  it("should convert range to CustomSpeedZone_t with min/max", () => {
    // Arrange

    // Act
    const result = convertPaceToTcx({ unit: "range", min: 3.0, max: 4.5 });

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 3.0,
        HighInMetersPerSecond: 4.5,
      },
    });
  });

  it("should return None_t for unsupported unit", () => {
    // Arrange

    // Act
    const result = convertPaceToTcx({ unit: "zone", value: 3 });

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});

describe("convertTargetToTcx", () => {
  it("should convert open target to None_t", () => {
    // Arrange
    const step = {
      target: { type: "open" },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should convert heart_rate target with zone", () => {
    // Arrange
    const step = {
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: 3,
      },
    });
  });

  it("should convert pace target with a single mps value", () => {
    // Arrange
    const step = {
      target: {
        type: "pace",
        value: { unit: "mps", value: 4.2 },
      },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: 4.2,
        HighInMetersPerSecond: 4.2,
      },
    });
  });

  it("should convert cadence target with rpm", () => {
    // Arrange
    const step = {
      target: {
        type: "cadence",
        value: { unit: "rpm", value: 90 },
      },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 90,
        High: 90,
      },
    });
  });

  it("should return None_t for power target (not supported in TCX)", () => {
    // Arrange
    const step = {
      target: {
        type: "power",
        value: { unit: "watts", value: 250 },
      },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should return None_t for heart_rate without value", () => {
    // Arrange
    const step = {
      target: { type: "heart_rate" },
    } as WorkoutStep;

    // Act
    const result = convertTargetToTcx(step, "cycling");

    // Assert
    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});
