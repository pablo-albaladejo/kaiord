/* eslint-disable no-magic-numbers -- test fixtures use literal percent/watts values for clarity */
import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { encodeRampPowerTarget } from "./power-encoder";

const DESCENDING = { zwift: { powerDirection: "descending" } };

const ASCENDING = { zwift: { powerDirection: "ascending" } };

const makeStep = (
  value: { unit: "range"; min: number; max: number; basis?: "percent_ftp" },
  extensions?: WorkoutStep["extensions"],
  intensity?: WorkoutStep["intensity"]
): WorkoutStep => ({
  stepIndex: 0,
  intensity,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "power",
  target: { type: "power", value },
  extensions,
});

describe("encodeRampPowerTarget direction", () => {
  it("should write a descending percent_ftp range from max down to min", () => {
    // Arrange
    const step = makeStep(
      { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
      DESCENDING
    );
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(0.75);
    expect(interval["@_PowerHigh"]).toBe(0.5);
  });

  it("should write a descending watts range from max down to min", () => {
    // Arrange
    const step = makeStep({ unit: "range", min: 150, max: 300 }, DESCENDING);
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(1.2);
    expect(interval["@_PowerHigh"]).toBe(0.6);
    expect(interval["@_kaiord:originalWattsLow"]).toBe(300);
    expect(interval["@_kaiord:originalWattsHigh"]).toBe(150);
  });

  it("should keep the ascending order for a range without the flag", () => {
    // Arrange
    const step = makeStep({
      unit: "range",
      min: 50,
      max: 75,
      basis: "percent_ftp",
    });
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(0.5);
    expect(interval["@_PowerHigh"]).toBe(0.75);
  });

  it("should write a cooldown without the flag from max down to min", () => {
    // Arrange
    const step = makeStep(
      { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
      undefined,
      "cooldown"
    );
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(0.75);
    expect(interval["@_PowerHigh"]).toBe(0.5);
  });

  it("should keep an explicitly ascending cooldown ascending", () => {
    // Arrange
    const step = makeStep(
      { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
      ASCENDING,
      "cooldown"
    );
    const interval: Record<string, unknown> = {};

    // Act
    encodeRampPowerTarget(step, interval);

    // Assert
    expect(interval["@_PowerLow"]).toBe(0.5);
    expect(interval["@_PowerHigh"]).toBe(0.75);
  });
});
