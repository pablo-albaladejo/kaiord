import { describe, expect, it } from "vitest";

import type { Target } from "../../types/krd";
import type { SportThresholds } from "../../types/sport-zones";
import { stepIntensityFactor } from "./intensity-factor";

const THRESHOLDS: SportThresholds = {
  ftp: 250,
  lthr: 160,
  thresholdPace: 250,
  paceUnit: "min_per_km",
};

const PRECISION = 5;
const FACTOR_PERCENT_80 = 0.8;
const FACTOR_AT_THRESHOLD = 1;
const FACTOR_HALF = 0.5;
const MIDPOINT_Z1 = 0.45;
const MIDPOINT_Z3 = 0.825;
const MIDPOINT_Z5 = 1.15;

describe("stepIntensityFactor", () => {
  it("should return the percent_ftp value as a fraction for a power target", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "percent_ftp", value: 80 },
    };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBeCloseTo(FACTOR_PERCENT_80, PRECISION);
  });

  it("should divide watts by FTP for a watts power target", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBeCloseTo(FACTOR_AT_THRESHOLD, PRECISION);
  });

  it("should return null for a watts power target without an FTP threshold", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    // Act
    const factor = stepIntensityFactor(target, { paceUnit: "min_per_km" });

    // Assert
    expect(factor).toBeNull();
  });

  it("should map a power zone target to its zone midpoint", () => {
    // Arrange
    const target: Target = { type: "power", value: { unit: "zone", value: 3 } };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBe(MIDPOINT_Z3);
  });

  it("should divide bpm by LTHR for a heart-rate target", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: 160 },
    };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBeCloseTo(FACTOR_AT_THRESHOLD, PRECISION);
  });

  it("should return null for a bpm heart-rate target without an LTHR threshold", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: 160 },
    };

    // Act
    const factor = stepIntensityFactor(target, { paceUnit: "min_per_km" });

    // Assert
    expect(factor).toBeNull();
  });

  it("should map a heart-rate zone target to its zone midpoint", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "zone", value: 1 },
    };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBe(MIDPOINT_Z1);
  });

  it("should compute the pace factor for a min_per_km threshold", () => {
    // Arrange
    const target: Target = { type: "pace", value: { unit: "mps", value: 4 } };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBeCloseTo(FACTOR_AT_THRESHOLD, PRECISION);
  });

  it("should compute the pace factor for a min_per_100m threshold", () => {
    // Arrange
    const target: Target = { type: "pace", value: { unit: "mps", value: 2 } };

    // Act
    const factor = stepIntensityFactor(target, {
      thresholdPace: 25,
      paceUnit: "min_per_100m",
    });

    // Assert
    expect(factor).toBeCloseTo(FACTOR_HALF, PRECISION);
  });

  it("should return null for an mps pace target without a threshold pace", () => {
    // Arrange
    const target: Target = { type: "pace", value: { unit: "mps", value: 4 } };

    // Act
    const factor = stepIntensityFactor(target, { paceUnit: "min_per_km" });

    // Assert
    expect(factor).toBeNull();
  });

  it("should map a pace zone target to its zone midpoint", () => {
    // Arrange
    const target: Target = { type: "pace", value: { unit: "zone", value: 5 } };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBe(MIDPOINT_Z5);
  });

  it("should clamp an out-of-range zone to the nearest midpoint", () => {
    // Arrange
    const target: Target = { type: "power", value: { unit: "zone", value: 9 } };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBe(MIDPOINT_Z5);
  });

  it("should return null for a non power/heart-rate/pace target", () => {
    // Arrange
    const target: Target = { type: "open" };

    // Act
    const factor = stepIntensityFactor(target, THRESHOLDS);

    // Assert
    expect(factor).toBeNull();
  });
});
