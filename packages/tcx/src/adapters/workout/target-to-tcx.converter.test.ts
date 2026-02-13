import { describe, expect, it } from "vitest";
import type { WorkoutStep } from "@kaiord/core";
import {
  convertHeartRateToTcx,
  convertPaceToTcx,
  convertCadenceToTcx,
  convertTargetToTcx,
} from "./target-to-tcx.converter";

describe("convertHeartRateToTcx", () => {
  it("should convert zone to PredefinedHeartRateZone_t", () => {
    const result = convertHeartRateToTcx({ unit: "zone", value: 3 });

    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: 3,
      },
    });
  });

  it("should convert bpm to CustomHeartRateZone_t", () => {
    const result = convertHeartRateToTcx({ unit: "bpm", value: 150 });

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
    const result = convertHeartRateToTcx({
      unit: "range",
      min: 120,
      max: 160,
    });

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
    const result = convertHeartRateToTcx({ unit: "unknown", value: 100 });

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});

describe("convertPaceToTcx", () => {
  it("should convert meters_per_second to CustomSpeedZone_t", () => {
    const result = convertPaceToTcx({
      unit: "meters_per_second",
      value: 4.2,
    });

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
    const result = convertPaceToTcx({ unit: "range", min: 3.0, max: 4.5 });

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
    const result = convertPaceToTcx({ unit: "zone", value: 3 });

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});

describe("convertCadenceToTcx", () => {
  it("should convert rpm to CustomCadenceZone_t", () => {
    const result = convertCadenceToTcx({ unit: "rpm", value: 90 });

    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 90,
        High: 90,
      },
    });
  });

  it("should convert range to CustomCadenceZone_t with min/max", () => {
    const result = convertCadenceToTcx({ unit: "range", min: 80, max: 100 });

    expect(result).toStrictEqual({
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: 80,
        High: 100,
      },
    });
  });

  it("should return None_t for unsupported unit", () => {
    const result = convertCadenceToTcx({ unit: "zone", value: 3 });

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});

describe("convertTargetToTcx", () => {
  it("should convert open target to None_t", () => {
    const step = {
      target: { type: "open" },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should convert heart_rate target with zone", () => {
    const step = {
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

    expect(result).toStrictEqual({
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: 3,
      },
    });
  });

  it("should convert pace target with meters_per_second", () => {
    const step = {
      target: {
        type: "pace",
        value: { unit: "meters_per_second", value: 4.2 },
      },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

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
    const step = {
      target: {
        type: "cadence",
        value: { unit: "rpm", value: 90 },
      },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

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
    const step = {
      target: {
        type: "power",
        value: { unit: "watts", value: 250 },
      },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });

  it("should return None_t for heart_rate without value", () => {
    const step = {
      target: { type: "heart_rate" },
    } as WorkoutStep;

    const result = convertTargetToTcx(step);

    expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
  });
});
