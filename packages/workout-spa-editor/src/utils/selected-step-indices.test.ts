/**
 * `selectedTopLevelStepIndices` resolves a selection to DOMAIN
 * `stepIndex` values, while `findById` reports the flat ARRAY position.
 * The two coincide in every all-plain-steps list, so the fixtures here
 * deliberately put a repetition block FIRST — that is the only shape
 * that can tell the two index spaces apart.
 */

import { describe, expect, it } from "vitest";

import type { Workout } from "../types/krd";
import { selectedTopLevelStepIndices } from "./selected-step-indices";

const BLOCK_CHILDREN = 2;

const step = (id: string, stepIndex: number) => ({
  id,
  stepIndex,
  durationType: "time" as const,
  durationValue: 60,
  targetType: "open" as const,
  intensity: "active" as const,
});

// `recalculateStepIndices` numbers block children into the top-level
// sequence, so with a 2-child block at array position 0 the following
// top-level steps carry stepIndex 2, 3 while sitting at array positions
// 1, 2.
const LEADING_BLOCK = {
  id: "block-uuid",
  repeatCount: 3,
  steps: [step("nested-a", 0), step("nested-b", 1)],
};

const BLOCK_FIRST_WORKOUT = {
  steps: [
    LEADING_BLOCK,
    step("after-block-1", BLOCK_CHILDREN),
    step("after-block-2", BLOCK_CHILDREN + 1),
  ],
} as unknown as Workout;

describe("selectedTopLevelStepIndices", () => {
  it("should return the domain stepIndex, not the flat array position", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, [
      "after-block-1",
    ]);

    // Assert
    // Array position is 1; the domain stepIndex is 2. Returning the
    // array position here would delete the wrong step downstream.
    expect(indices).toEqual([BLOCK_CHILDREN]);
  });

  it("should resolve several selected steps past a leading block", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, [
      "after-block-1",
      "after-block-2",
    ]);

    // Assert
    expect(indices).toEqual([BLOCK_CHILDREN, BLOCK_CHILDREN + 1]);
  });

  it("should refuse a selection that resolves inside a repetition block", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, [
      "nested-a",
    ]);

    // Assert
    expect(indices).toBeNull();
  });

  it("should refuse a selection that mixes a nested step with a top-level one", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, [
      "after-block-1",
      "nested-a",
    ]);

    // Assert
    expect(indices).toBeNull();
  });

  it("should refuse a selection that resolves to the block itself", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, [
      "block-uuid",
    ]);

    // Assert
    expect(indices).toBeNull();
  });

  it("should refuse an unknown id", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, ["nope"]);

    // Assert
    expect(indices).toBeNull();
  });

  it("should refuse an empty selection", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(BLOCK_FIRST_WORKOUT, []);

    // Assert
    expect(indices).toBeNull();
  });

  it("should refuse when no workout is loaded", () => {
    // Arrange

    // Act
    const indices = selectedTopLevelStepIndices(undefined, ["after-block-1"]);

    // Assert
    expect(indices).toBeNull();
  });
});
