/* eslint-disable no-magic-numbers -- test fixtures use literal duration/power values for clarity */
import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertStepToInterval } from "./step-encoder";

const makeStep = (overrides: Partial<WorkoutStep> = {}): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 120 },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

describe("convertStepToInterval", () => {
  it("should encode time duration into interval", () => {
    // Arrange
    const step = makeStep({
      duration: { type: "time", seconds: 180 },
      durationType: "time",
    });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result["@_Duration"]).toBe(180);
  });

  it("should encode power target for SteadyState interval type", () => {
    // Arrange
    const step = makeStep({
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: 85 } },
    });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result["@_Power"]).toBe(0.85);
    expect(result["@_kaiord:powerUnit"]).toBe("percent_ftp");
  });

  it("should encode cadence target into interval", () => {
    // Arrange
    const step = makeStep({
      targetType: "cadence",
      target: { type: "cadence", value: { unit: "rpm", value: 95 } },
    });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result["@_Cadence"]).toBe(95);
  });

  it("should include step name in interval metadata", () => {
    // Arrange
    const step = makeStep({ name: "Threshold block" });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result["@_kaiord:name"]).toBe("Threshold block");
  });

  it("should include step intensity in interval metadata", () => {
    // Arrange
    const step = makeStep({ intensity: "active" });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result["@_kaiord:intensity"]).toBe("active");
  });

  it("should attach textevent when step has text events extension", () => {
    // Arrange
    const step = makeStep({
      extensions: {
        zwift: {
          textEvents: [{ message: "Push!", timeoffset: 10 }],
        },
      },
    });

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result.textevent).toStrictEqual({
      "@_message": "Push!",
      "@_timeoffset": 10,
    });
  });

  it("should not include textevent key when no text events extension present", () => {
    // Arrange
    const step = makeStep();

    // Act
    const result = convertStepToInterval(step, "SteadyState");

    // Assert
    expect(result.textevent).toBeUndefined();
  });

  it("should encode open duration as zero", () => {
    // Arrange
    const step = makeStep({
      durationType: "open",
      duration: { type: "open" },
    });

    // Act
    const result = convertStepToInterval(step, "FreeRide");

    // Assert
    expect(result["@_Duration"]).toBe(0);
  });

  it("should encode Warmup ramp power targets", () => {
    // Arrange
    const step = makeStep({
      targetType: "power",
      target: { type: "power", value: { unit: "range", min: 100, max: 200 } },
    });

    // Act
    const result = convertStepToInterval(step, "Warmup");

    // Assert
    // range{min:100,max:200} → watts-lossy: (min/250)=0.4, (max/250)=0.8
    expect(result["@_PowerLow"]).toBe(0.4);
    expect(result["@_PowerHigh"]).toBe(0.8);
  });
});
