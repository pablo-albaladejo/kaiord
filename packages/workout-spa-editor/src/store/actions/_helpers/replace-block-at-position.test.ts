import { describe, expect, it } from "vitest";

import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { replaceBlockAtPosition } from "./replace-block-at-position";

const REPEAT_DEFAULT = 2;
const REPEAT_NEW = 5;

const makeStep = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "open",
  duration: { type: "open" },
  targetType: "open",
  target: { type: "open" },
});

const makeBlock = (id: string, repeat = REPEAT_DEFAULT): RepetitionBlock => ({
  id,
  repeatCount: repeat,
  steps: [],
});

describe("replaceBlockAtPosition", () => {
  it("should replace the block at the given position", () => {
    // Arrange
    const workout: Workout = {
      name: "w",
      sport: "running",
      steps: [makeStep(0), makeBlock("a"), makeStep(1)],
    };
    const newBlock = makeBlock("b", REPEAT_NEW);

    // Act
    const result = replaceBlockAtPosition(workout, 1, newBlock);

    // Assert
    expect(result.steps[1]).toEqual(newBlock);
  });

  it("should leave other steps untouched", () => {
    // Arrange
    const left = makeStep(0);
    const right = makeStep(1);
    const workout: Workout = {
      name: "w",
      sport: "running",
      steps: [left, makeBlock("a"), right],
    };

    // Act
    const result = replaceBlockAtPosition(workout, 1, makeBlock("b"));

    // Assert
    expect(result.steps[0]).toBe(left);
    expect(result.steps[2]).toBe(right);
  });

  it("should return a fresh workout object", () => {
    // Arrange
    const workout: Workout = {
      name: "w",
      sport: "running",
      steps: [makeBlock("a")],
    };

    // Act
    const result = replaceBlockAtPosition(workout, 0, makeBlock("b"));

    // Assert
    expect(result).not.toBe(workout);
    expect(result.steps).not.toBe(workout.steps);
  });
});
