import { describe, expect, it } from "vitest";
import type { WorkoutStep } from "@kaiord/core";
import { convertStrokeTarget } from "./krd-to-fit-target-stroke.converter";

describe("convertStrokeTarget", () => {
  it("should convert freestyle stroke target (value 0)", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "distance",
      duration: { type: "distance", meters: 100 },
      targetType: "stroke_type",
      target: {
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 0 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertStrokeTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "swimStroke",
      targetValue: 0,
    });
  });

  it("should convert backstroke target (value 1)", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "distance",
      duration: { type: "distance", meters: 100 },
      targetType: "stroke_type",
      target: {
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 1 },
      },
    };
    const message: Record<string, unknown> = {};

    // Act
    convertStrokeTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "swimStroke",
      targetValue: 1,
    });
  });

  it("should convert all swim stroke values 0-5", () => {
    const strokes = [
      { value: 0, name: "freestyle" },
      { value: 1, name: "backstroke" },
      { value: 2, name: "breaststroke" },
      { value: 3, name: "butterfly" },
      { value: 4, name: "drill" },
      { value: 5, name: "mixed/IM" },
    ];

    strokes.forEach(({ value }) => {
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
      expect(message.targetType).toBe("swimStroke");
      expect(message.targetValue).toBe(value);
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
