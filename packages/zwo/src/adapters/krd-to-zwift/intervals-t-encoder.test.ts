/* eslint-disable no-magic-numbers -- test fixtures use literal repeat/power/cadence values for clarity */
import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { encodeIntervalsT } from "./intervals-t-encoder";

const makeStep = (
  overrides: Partial<WorkoutStep> = {},
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

const makeBlock = (
  onStep: WorkoutStep,
  offStep: WorkoutStep,
  repeatCount = 5,
): RepetitionBlock => ({
  repeatCount,
  steps: [onStep, offStep],
});

describe("encodeIntervalsT", () => {
  it("should set @_Repeat from repeatCount", () => {
    // Arrange
    const block = makeBlock(makeStep(), makeStep(), 8);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_Repeat"]).toBe(8);
  });

  it("should encode on-step time duration as @_OnDuration", () => {
    // Arrange
    const onStep = makeStep({ duration: { type: "time", seconds: 30 }, durationType: "time" });
    const offStep = makeStep({ duration: { type: "time", seconds: 90 }, durationType: "time" });
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_OnDuration"]).toBe(30);
    expect(result["@_OffDuration"]).toBe(90);
  });

  it("should encode on-step distance duration as @_OnDuration meters", () => {
    // Arrange
    const onStep = makeStep({
      durationType: "distance",
      duration: { type: "distance", meters: 400 },
    });
    const offStep = makeStep({
      durationType: "distance",
      duration: { type: "distance", meters: 200 },
    });
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_OnDuration"]).toBe(400);
    expect(result["@_OffDuration"]).toBe(200);
  });

  it("should encode percent_ftp power targets as @_OnPower and @_OffPower fractions", () => {
    // Arrange
    const onStep = makeStep({
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: 120 } },
    });
    const offStep = makeStep({
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: 50 } },
    });
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_OnPower"]).toBe(1.2);
    expect(result["@_OffPower"]).toBe(0.5);
  });

  it("should not set @_OnPower when on-step power unit is watts", () => {
    // Arrange
    const onStep = makeStep({
      targetType: "power",
      target: { type: "power", value: { unit: "watts", value: 300 } },
    });
    const offStep = makeStep();
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_OnPower"]).toBeUndefined();
  });

  it("should encode rpm cadence from on-step as @_Cadence", () => {
    // Arrange
    const onStep = makeStep({
      targetType: "cadence",
      target: { type: "cadence", value: { unit: "rpm", value: 100 } },
    });
    const offStep = makeStep({
      targetType: "cadence",
      target: { type: "cadence", value: { unit: "rpm", value: 60 } },
    });
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_Cadence"]).toBe(100);
    expect(result["@_CadenceResting"]).toBe(60);
  });

  it("should compute average cadence from range target", () => {
    // Arrange
    const onStep = makeStep({
      targetType: "cadence",
      target: { type: "cadence", value: { unit: "range", min: 80, max: 100 } },
    });
    const offStep = makeStep();
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_Cadence"]).toBe(90);
  });

  it("should resolve cadence from zwift extension when target is not cadence", () => {
    // Arrange
    const onStep: WorkoutStep = {
      ...makeStep(),
      extensions: { zwift: { cadence: 85 } },
    };
    const offStep = makeStep();
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_Cadence"]).toBe(85);
  });

  it("should not set @_Cadence when neither cadence target nor zwift extension present", () => {
    // Arrange
    const onStep = makeStep();
    const offStep = makeStep();
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result["@_Cadence"]).toBeUndefined();
    expect(result["@_CadenceResting"]).toBeUndefined();
  });

  it("should attach textevent from on-step text events", () => {
    // Arrange
    const onStep: WorkoutStep = {
      ...makeStep({
        targetType: "power",
        target: { type: "power", value: { unit: "percent_ftp", value: 110 } },
      }),
      extensions: { zwift: { textEvents: [{ message: "Go!", timeoffset: 5 }] } },
    };
    const offStep = makeStep();
    const block = makeBlock(onStep, offStep);

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result.textevent).toStrictEqual({ "@_message": "Go!", "@_timeoffset": 5 });
  });

  it("should not include textevent key when on-step has no text events", () => {
    // Arrange
    const block = makeBlock(makeStep(), makeStep());

    // Act
    const result = encodeIntervalsT(block);

    // Assert
    expect(result.textevent).toBeUndefined();
  });
});
