import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertTarget } from "./krd-to-fit-target.converter";

// Characterization tests for convertTarget (the dispatcher). The dispatcher
// branches on `step.target.type` and delegates to the per-type converter.
// These tests pin the dispatch table — production code is unchanged.

const baseStep = (
  targetType: WorkoutStep["targetType"],
  target: WorkoutStep["target"]
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType,
  target,
});

describe("convertTarget (dispatcher)", () => {
  it("emits open targetType when step.target.type === 'open'", () => {
    // Arrange
    const step = baseStep("open", { type: "open" });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message).toStrictEqual({ targetType: "open" });
  });

  it("should dispatch power → convertPowerTarget", () => {
    // Arrange
    const step = baseStep("power", {
      type: "power",
      value: { unit: "zone", value: 3 },
    });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message.targetType).toBe("power");
    expect(message.targetPowerZone).toBe(3);
  });

  it("should dispatch heart_rate → convertHeartRateTarget", () => {
    // Arrange
    const step = baseStep("heart_rate", {
      type: "heart_rate",
      value: { unit: "zone", value: 2 },
    });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message.targetType).toBe("heartRate");
    expect(message.targetHrZone).toBe(2);
  });

  it("should dispatch cadence → convertCadenceTarget", () => {
    // Arrange
    const step = baseStep("cadence", {
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message.targetType).toBe("cadence");
  });

  it("should dispatch pace → convertPaceTarget", () => {
    // Arrange
    const step = baseStep("pace", {
      type: "pace",
      value: { unit: "m_per_s", value: 3.0 },
    });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message.targetType).toBe("speed");
  });

  it("should dispatch stroke_type → convertStrokeTarget", () => {
    // Arrange
    const step = baseStep("stroke_type", {
      type: "stroke_type",
      value: { unit: "stroke_type", value: "freestyle" },
    });
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message.targetType).toBe("swimStroke");
  });

  it("should not throw when target.type is unhandled (fall-through)", () => {
    // Arrange
    const step = {
      stepIndex: 0,
      durationType: "time" as const,
      duration: { type: "time" as const, seconds: 300 },
      targetType: "open" as const,
      target: { type: "unknown" as never } as WorkoutStep["target"],
    } satisfies WorkoutStep;
    const message: Record<string, unknown> = {};

    // Act
    convertTarget(step, message);

    // Assert
    expect(message).toStrictEqual({});
  });
});
