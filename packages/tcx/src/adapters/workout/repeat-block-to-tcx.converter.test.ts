import type { Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import {
  REPEAT_COUNT_THREE,
  STEP_ID_FIVE,
  STEP_ID_FOUR,
  STEP_ID_THREE,
} from "../../test-utils/constants";
import { buildTcxSteps } from "./repeat-block-to-tcx.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createWorkoutStep = (
  overrides: Partial<WorkoutStep> = {}
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

const createRepetitionBlock = (): RepetitionBlock => ({
  repeatCount: REPEAT_COUNT_THREE,
  steps: [
    createWorkoutStep({ name: "Work" }),
    createWorkoutStep({ name: "Rest" }),
  ],
});

describe("buildTcxSteps", () => {
  it("should emit a Repeat_t step for a repetition block", () => {
    // Arrange
    const logger = createMockLogger();
    const steps = [createRepetitionBlock()];

    // Act
    const result = buildTcxSteps(steps, "generic", logger);

    // Assert
    expect(result[0]["@_xsi:type"]).toBe("Repeat_t");
    expect(result[0].Repetitions).toBe(REPEAT_COUNT_THREE);
    expect(result[0].Child).toHaveLength(2);
  });

  it("should assign contiguous StepIds across leaf steps and repeat children", () => {
    // Arrange
    const logger = createMockLogger();
    const steps = [
      createWorkoutStep({ name: "Warmup" }),
      createRepetitionBlock(),
      createWorkoutStep({ name: "Cooldown" }),
    ];

    // Act
    const result = buildTcxSteps(steps, "generic", logger);

    // Assert
    expect(result[0].StepId).toBe(1);
    expect(result[1].StepId).toBe(2);
    const children = result[1].Child as Array<Record<string, unknown>>;
    expect(children.map((child) => child.StepId)).toStrictEqual([
      STEP_ID_THREE,
      STEP_ID_FOUR,
    ]);
    expect(result[2].StepId).toBe(STEP_ID_FIVE);
  });

  it("should mark repeat children as Step_t leaf steps", () => {
    // Arrange
    const logger = createMockLogger();
    const steps = [createRepetitionBlock()];

    // Act
    const result = buildTcxSteps(steps, "generic", logger);

    // Assert
    const children = result[0].Child as Array<Record<string, unknown>>;
    expect(children[0]["@_xsi:type"]).toBe("Step_t");
    expect(children[1]["@_xsi:type"]).toBe("Step_t");
  });
});
