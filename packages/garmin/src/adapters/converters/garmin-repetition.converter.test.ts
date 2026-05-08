import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { REPETITION, STEP_ORDER, STEP_TYPE } from "../../test-utils/constants";
import { mapRepetitionBlock } from "./garmin-repetition.converter";

// Characterization tests for mapRepetitionBlock. Capture current shape
// of GarminWorkoutStepInput emitted for a RepeatGroupDTO. Production
// code is not modified by PR3.
const buildStep = (overrides: Partial<WorkoutStep> = {}): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
  ...overrides,
});

describe("mapRepetitionBlock (characterization)", () => {
  it("should emit a RepeatGroupDTO with iteration end-condition", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 3,
      steps: [buildStep()],
    };
    const counter = { value: 10 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.type).toBe("RepeatGroupDTO");
    expect(result.endCondition.conditionTypeKey).toBe("iterations");
    expect(result.endCondition.displayable).toBe(false);
    expect(result.endConditionValue).toBe(REPETITION.COUNT_3);
  });

  it("should use stepTypeKey 'repeat' with displayOrder 6 in the stepType field", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [buildStep()],
    };
    const counter = { value: 0 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.stepType.stepTypeKey).toBe("repeat");
    expect(result.stepType.displayOrder).toBe(STEP_TYPE.REPEAT_DISPLAY_ORDER);
  });

  it("should consume one stepOrder slot from the counter for the repeat itself", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [buildStep(), buildStep({ stepIndex: 1 })],
    };
    const counter = { value: 5 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.stepOrder).toBe(STEP_ORDER.COUNTER_FIVE);
    expect(counter.value).toBe(STEP_ORDER.COUNTER_EIGHT);
  });

  it("should map inner steps in order under workoutSteps", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 4,
      steps: [
        buildStep({ stepIndex: 0, intensity: "warmup" }),
        buildStep({ stepIndex: 1, intensity: "cooldown" }),
      ],
    };
    const counter = { value: 0 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.workoutSteps).toHaveLength(2);
    expect(result.workoutSteps[0].stepOrder).toBe(1);
    expect(result.workoutSteps[1].stepOrder).toBe(2);
  });

  it("should propagate numberOfIterations from repeatCount", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 7,
      steps: [buildStep()],
    };
    const counter = { value: 0 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.numberOfIterations).toBe(REPETITION.COUNT_7);
    expect(result.endConditionValue).toBe(REPETITION.COUNT_7);
  });

  it("should emit an empty workoutSteps array when the block contains no steps", () => {
    // Arrange
    const block: RepetitionBlock = {
      repeatCount: 2,
      steps: [],
    };
    const counter = { value: 0 };

    // Act
    const result = mapRepetitionBlock(block, counter);

    // Assert
    expect(result.workoutSteps).toHaveLength(0);
  });
});
