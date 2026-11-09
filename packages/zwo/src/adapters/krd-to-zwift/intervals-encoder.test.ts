import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertStepsToZwiftIntervals } from "./intervals-encoder";

const openStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
} as const satisfies WorkoutStep;

describe("convertStepsToZwiftIntervals", () => {
  it("should encode a step with a stray repeatCount and no steps as a single step instead of throwing", () => {
    // Arrange
    const stray = { ...openStep, repeatCount: 2 } as unknown as WorkoutStep;

    // Act
    const result = convertStepsToZwiftIntervals([stray]);

    // Assert
    expect(result).toStrictEqual([
      { FreeRide: [], ":@": { "@_Duration": 60 } },
    ]);
  });

  it("should unroll a real repetition block repeatCount times", () => {
    // Arrange
    const block: RepetitionBlock = { repeatCount: 2, steps: [openStep] };

    // Act
    const result = convertStepsToZwiftIntervals([block]);

    // Assert
    expect(result).toHaveLength(2);
  });
});
