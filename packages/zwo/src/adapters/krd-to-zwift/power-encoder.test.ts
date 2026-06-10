/* eslint-disable no-magic-numbers -- test fixtures use literal FTP/percent/zone/watts values for clarity */
import type { WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { encodeRampPowerTarget, encodeSteadyStatePowerTarget } from "./power-encoder";

const makeStep = (target: WorkoutStep["target"]): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: target.type,
  target,
});

describe("encodeSteadyStatePowerTarget", () => {
  it("should encode percent_ftp target as @_Power fraction", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "percent_ftp", value: 85 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(0.85);
    expect(interval["@_kaiord:powerUnit"]).toBe("percent_ftp");
  });

  it("should encode 100% FTP as @_Power 1.0", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "percent_ftp", value: 100 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(1.0);
    expect(interval["@_kaiord:powerUnit"]).toBe("percent_ftp");
  });

  it("should encode zone target converting to percent_ftp fraction", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "zone", value: 4 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    // zone 4 = 105% FTP → 1.05
    expect(interval["@_Power"]).toBe(1.05);
    expect(interval["@_kaiord:powerUnit"]).toBe("zone");
    expect(interval["@_kaiord:powerZone"]).toBe(4);
  });

  it("should encode zone 1 (recovery) as 0.55", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "zone", value: 1 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(0.55);
  });

  it("should encode absolute watts target using assumed FTP of 250", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "watts", value: 250 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(1.0);
    expect(interval["@_kaiord:powerUnit"]).toBe("watts");
    expect(interval["@_kaiord:originalWatts"]).toBe(250);
    expect(interval["@_kaiord:assumedFtp"]).toBe(250);
  });

  it("should encode 200 watts as 0.8 FTP fraction with assumed FTP 250", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "watts", value: 200 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(0.8);
    expect(interval["@_kaiord:originalWatts"]).toBe(200);
  });

  it("should not modify interval when target type is not power", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval).toStrictEqual({});
  });

  it.each([
    [1, 0.55],
    [2, 0.75],
    [3, 0.90],
    [5, 1.20],
    [6, 1.50],
    [7, 2.00],
  ] as const)("should encode zone %i as %f", (zone, expected) => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "zone", value: zone } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeSteadyStatePowerTarget(step, interval);

    // Assert
    expect(interval["@_Power"]).toBe(expected);
  });
});

describe("encodeRampPowerTarget", () => {
  it("should encode percent_ftp as equal PowerLow and PowerHigh", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "percent_ftp", value: 80 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(0.8);
    expect(interval["@_PowerHigh"]).toBe(0.8);
    expect(interval["@_kaiord:powerUnit"]).toBe("percent_ftp");
  });

  it("should encode zone as equal PowerLow and PowerHigh", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "zone", value: 3 } });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    // zone 3 = 90% FTP → 0.90
    expect(interval["@_PowerLow"]).toBe(0.90);
    expect(interval["@_PowerHigh"]).toBe(0.90);
    expect(interval["@_kaiord:powerUnit"]).toBe("zone");
    expect(interval["@_kaiord:powerZone"]).toBe(3);
  });

  it("should encode watt range as PowerLow and PowerHigh fractions with lossy warning", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "range", min: 150, max: 300 } });
    const interval: Record<string, unknown> = {};
    const logger = createMockLogger();
    const warnSpy = vi.spyOn(logger, "warn");

    // Act
    encodeRampPowerTarget(step, interval, logger);

    // Assert
    expect(interval["@_PowerLow"]).toBe((150 / 250) * 100 / 100);
    expect(interval["@_PowerHigh"]).toBe((300 / 250) * 100 / 100);
    expect(interval["@_kaiord:originalWattsLow"]).toBe(150);
    expect(interval["@_kaiord:originalWattsHigh"]).toBe(300);
    expect(interval["@_kaiord:assumedFtp"]).toBe(250);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("should emit logger warn for watts range conversion", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "range", min: 100, max: 200 } });
    const interval: Record<string, unknown> = {};
    const logger = createMockLogger();
    const warnSpy = vi.spyOn(logger, "warn");

    // Act
    encodeRampPowerTarget(step, interval, logger);

    // Assert
    expect(warnSpy).toHaveBeenCalledWith(
      "Lossy conversion: watts converted to percent FTP",
      expect.objectContaining({ assumedFtp: 250 }),
    );
  });

  it("should not emit warning when no logger provided for watts range", () => {
    // Arrange
    const step = makeStep({ type: "power", value: { unit: "range", min: 100, max: 200 } });
    const interval: Record<string, unknown> = {};

    // Act & Assert
    expect(() => encodeRampPowerTarget(step, interval)).not.toThrow();
  });

  it("should not modify interval when target type is not power", () => {
    // Arrange
    const step = makeStep({ type: "open" });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval).toStrictEqual({});
  });
});
