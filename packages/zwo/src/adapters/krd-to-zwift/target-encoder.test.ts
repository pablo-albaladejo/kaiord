/* eslint-disable no-magic-numbers -- test fixtures use literal FTP/pace/cadence values for clarity */
import type { WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  encodeCadence,
  encodeFreeRideTargets,
  encodeRampTargets,
  encodeSteadyStateTargets,
  encodeTargets,
} from "./target-encoder";

const makeStep = (target: WorkoutStep["target"]): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: target.type,
  target,
});

describe("encodeSteadyStateTargets", () => {
  it("should encode percent_ftp power target", () => {
    // Arrange
    const step = makeStep({
      type: "power",
      value: { unit: "percent_ftp", value: 75 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStateTargets(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(0.75);
    expect(interval["@_kaiord:powerUnit"]).toBe("percent_ftp");
  });

  it("should encode mps pace target as seconds per km", () => {
    // Arrange
    // 4 m/s → 1000/4 = 250 s/km
    const step = makeStep({ type: "pace", value: { unit: "mps", value: 4 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStateTargets(step, interval);

    // Assert
    expect(interval["@_pace"]).toBe(250);
  });

  it("should not set pace when target type is not pace", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStateTargets(step, interval);

    // Assert
    expect(interval["@_pace"]).toBeUndefined();
  });
});

describe("encodeRampTargets", () => {
  it("should encode power range as PowerLow and PowerHigh", () => {
    // Arrange
    const step = makeStep({
      type: "power",
      value: { unit: "range", min: 125, max: 250 },
    });
    const interval: Record<string, unknown> = {};
    const logger = createMockLogger();

    // Act
    encodeRampTargets(step, interval, logger);

    // Assert
    // range{min:125,max:250} → watts-lossy: (min/250)=0.5, (max/250)=1.0
    expect(interval["@_PowerLow"]).toBe(0.5);
    expect(interval["@_PowerHigh"]).toBe(1.0);
  });

  it("should encode mps pace range as paceLow and paceHigh (inverted)", () => {
    // Arrange
    // min 3 m/s, max 5 m/s → paceLow = 1000/5 = 200, paceHigh = 1000/3 ≈ 333.3
    const step = makeStep({
      type: "pace",
      value: { unit: "range", min: 3, max: 5 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampTargets(step, interval);

    // Assert
    expect(interval["@_paceLow"]).toBe(1000 / 5);
    expect(interval["@_paceHigh"]).toBe(1000 / 3);
  });

  it("should not set pace keys when target type is not pace", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampTargets(step, interval);

    // Assert
    expect(interval["@_paceLow"]).toBeUndefined();
    expect(interval["@_paceHigh"]).toBeUndefined();
  });
});

describe("encodeFreeRideTargets", () => {
  it("should encode flatRoad extension from lowercase key", () => {
    // Arrange
    const step: WorkoutStep = {
      ...makeStep({ type: "open" }),
      extensions: { zwift: { flatRoad: 1 } },
    };
    const interval: Record<string, unknown> = {};

    // Act
    encodeFreeRideTargets(step, interval);

    // Assert
    expect(interval["@_FlatRoad"]).toBe(1);
  });

  it("should encode flatRoad extension from PascalCase FlatRoad key", () => {
    // Arrange
    const step: WorkoutStep = {
      ...makeStep({ type: "open" }),
      extensions: { zwift: { FlatRoad: 0 } },
    };
    const interval: Record<string, unknown> = {};

    // Act
    encodeFreeRideTargets(step, interval);

    // Assert
    expect(interval["@_FlatRoad"]).toBe(0);
  });

  it("should not set FlatRoad when no zwift extension present", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeFreeRideTargets(step, interval);

    // Assert
    expect(interval["@_FlatRoad"]).toBeUndefined();
  });
});

describe("encodeTargets dispatch", () => {
  it("should delegate SteadyState to steady-state encoder", () => {
    // Arrange
    const step = makeStep({
      type: "power",
      value: { unit: "percent_ftp", value: 90 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeTargets(step, "SteadyState", interval);

    // Assert
    expect(interval["@_Power"]).toBe(0.9);
  });

  it.each([
    { type: "Warmup", percent: 60, low: 0.6 },
    { type: "Cooldown", percent: 50, low: 0.5 },
    { type: "Ramp", percent: 70, low: 0.7 },
  ])("should delegate $type to ramp encoder", ({ type, percent, low }) => {
    // Arrange
    const step = makeStep({
      type: "power",
      value: { unit: "percent_ftp", value: percent },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeTargets(step, type, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(low);
    expect(interval["@_PowerHigh"]).toBe(low);
  });

  it("should delegate FreeRide to free-ride encoder", () => {
    // Arrange
    const step: WorkoutStep = {
      ...makeStep({ type: "open" }),
      extensions: { zwift: { flatRoad: 1 } },
    };
    const interval: Record<string, unknown> = {};

    // Act
    encodeTargets(step, "FreeRide", interval);

    // Assert
    expect(interval["@_FlatRoad"]).toBe(1);
  });

  it("should not set any power key for unknown interval type", () => {
    // Arrange
    const step = makeStep({
      type: "power",
      value: { unit: "percent_ftp", value: 80 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeTargets(step, "Unknown", interval);

    // Assert
    expect(interval["@_Power"]).toBeUndefined();
    expect(interval["@_PowerLow"]).toBeUndefined();
  });
});

describe("encodeCadence", () => {
  it("should encode rpm cadence target as @_Cadence", () => {
    // Arrange
    const step = makeStep({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeCadence(step, interval);

    // Assert
    expect(interval["@_Cadence"]).toBe(90);
  });

  it("should not set @_Cadence when target type is not cadence", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeCadence(step, interval);

    // Assert
    expect(interval["@_Cadence"]).toBeUndefined();
  });

  it("should not set @_Cadence for cadence range unit", () => {
    // Arrange
    const step = makeStep({
      type: "cadence",
      value: { unit: "range", min: 80, max: 100 },
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeCadence(step, interval);

    // Assert
    expect(interval["@_Cadence"]).toBeUndefined();
  });
});
