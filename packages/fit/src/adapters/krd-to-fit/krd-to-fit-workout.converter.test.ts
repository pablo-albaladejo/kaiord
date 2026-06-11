import type { Workout, WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { convertWorkoutSteps } from "./krd-to-fit-workout.converter";

const STEP_COUNT = 3;
const REPEAT_COUNT = 4;
const FLATTENED_MESSAGE_COUNT = 5;
const REPEAT_MESSAGE_POSITION = 3;
const LAST_MESSAGE_INDEX = 4;

const step = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
});

describe("convertWorkoutSteps", () => {
  it("should index individual steps sequentially", () => {
    // Arrange
    const logger = createMockLogger();
    const workout: Workout = {
      sport: "cycling",
      steps: [step(0), step(1), step(2)],
    };

    // Act
    const messages = convertWorkoutSteps(workout, logger) as Array<
      Record<string, unknown>
    >;

    // Assert
    expect(messages).toHaveLength(STEP_COUNT);
    expect(messages.map((m) => m.messageIndex)).toStrictEqual([0, 1, 2]);
  });

  it("should flatten a repetition block and append a repeat message", () => {
    // Arrange
    const logger = createMockLogger();
    const workout: Workout = {
      sport: "running",
      steps: [
        step(0),
        { repeatCount: REPEAT_COUNT, steps: [step(1), step(2)] },
        step(STEP_COUNT),
      ],
    };

    // Act
    const messages = convertWorkoutSteps(workout, logger) as Array<
      Record<string, unknown>
    >;

    // Assert
    expect(messages).toHaveLength(FLATTENED_MESSAGE_COUNT);
    const repeatMessage = messages[REPEAT_MESSAGE_POSITION];
    expect(repeatMessage.durationType).toBe("repeatUntilStepsCmplt");
    expect(repeatMessage.durationStep).toBe(1);
    expect(repeatMessage.repeatSteps).toBe(REPEAT_COUNT);
    expect(repeatMessage.targetType).toBe("open");
    expect(messages[LAST_MESSAGE_INDEX].messageIndex).toBe(LAST_MESSAGE_INDEX);
  });

  it("should return an empty list for a workout without steps", () => {
    // Arrange
    const logger = createMockLogger();
    const workout: Workout = { sport: "cycling", steps: [] };

    // Act
    const messages = convertWorkoutSteps(workout, logger);

    // Assert
    expect(messages).toStrictEqual([]);
  });
});
