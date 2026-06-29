import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertStrokeTarget } from "./krd-to-fit-target-stroke.converter";

describe("convertStrokeTarget", () => {
  it.each([
    { value: 0 },
    { value: 1 },
    { value: 2 },
    { value: 3 },
    { value: 4 },
    { value: 5 },
  ])("should convert swim stroke value $value", ({ value }) => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "distance",
      duration: { type: "distance", meters: 100 },
      targetType: "stroke_type",
      target: {
        type: "stroke_type",
        value: { unit: "swim_stroke", value },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertStrokeTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "swimStroke",
      targetValue: value,
    });
  });

  it("should not modify targetValue when target type is not stroke_type", () => {
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
    convertStrokeTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "swimStroke",
    });
  });
});
