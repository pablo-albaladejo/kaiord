import { describe, expect, it } from "vitest";

import type { RepetitionBlock, WorkoutStep } from "./schemas/workout";
import { isRepetitionBlock } from "./type-guards";

describe("isRepetitionBlock", () => {
  it("should return true for a valid RepetitionBlock", () => {
    // Arrange

    // Act
    const block: RepetitionBlock = {
      repeatCount: 3,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };

    // Assert
    expect(isRepetitionBlock(block)).toBe(true);
  });

  it("should return false for a WorkoutStep", () => {
    // Arrange

    // Act
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: { type: "power", value: { unit: "watts", value: 200 } },
      intensity: "warmup",
    };

    // Assert
    expect(isRepetitionBlock(step)).toBe(false);
  });

  it("should work as a type-narrowing filter", () => {
    // Arrange
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
    };
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [step],
    };
    const items: Array<WorkoutStep | RepetitionBlock> = [step, block, step];

    // Act
    const blocks = items.filter(isRepetitionBlock);

    // Assert
    expect(blocks).toHaveLength(1);
    expect(blocks[0].repeatCount).toBe(2);
  });
});
