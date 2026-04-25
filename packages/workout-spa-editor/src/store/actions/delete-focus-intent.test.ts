/**
 * Focus-intent tests for delete actions (§6.1).
 *
 * Covers the four branches of the `nextAfterDelete` rule for
 * `deleteStepAction` and `deleteRepetitionBlockAction`: next sibling,
 * previous sibling, empty-state, and block-cascade (block deletion
 * going through the same rule as a main-list delete).
 */

import { afterEach, describe, expect, it } from "vitest";

import type { KRD } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

const step = (stepIndex: number) => ({
  stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 300 },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "watts" as const, value: 150 },
  },
});

const buildKrd = (steps: Array<unknown>): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    extensions: {
      structured_workout: { sport: "cycling", steps },
    },
  }) as unknown as KRD;

const resetStore = () => {
  useWorkoutStore.setState({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    deletedSteps: [],
    pendingFocusTarget: null,
  });
};

describe("deleteStepAction focus intent", () => {
  afterEach(resetStore);

  it("focuses the next sibling when one exists", () => {
    // Arrange — three steps; delete the middle one.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([step(0), step(1), step(2)]));
    const after = useWorkoutStore.getState().currentWorkout!.extensions!
      .structured_workout as { steps: Array<{ id: string }> };
    const thirdId = after.steps[2].id;

    // Act
    useWorkoutStore.getState().deleteStep(1);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: thirdId,
    });
  });

  it("falls back to the previous sibling when the tail was deleted", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0), step(1)]));
    const firstId = (
      useWorkoutStore.getState().currentWorkout!.extensions!
        .structured_workout as { steps: Array<{ id: string }> }
    ).steps[0].id;

    // Act — delete the last step.
    useWorkoutStore.getState().deleteStep(1);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: firstId,
    });
  });

  it("falls back to empty-state when the list becomes empty", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0)]));

    // Act
    useWorkoutStore.getState().deleteStep(0);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "empty-state",
    });
  });
});

describe("deleteRepetitionBlockAction focus intent", () => {
  afterEach(resetStore);

  it("focuses the next main-list sibling after a block delete", () => {
    // Arrange — a block followed by a top-level step.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([{ repeatCount: 2, steps: [step(0)] }, step(1)]));
    const workout = useWorkoutStore.getState().currentWorkout!.extensions!
      .structured_workout as { steps: Array<{ id: string }> };
    const blockId = workout.steps[0].id;
    const nextId = workout.steps[1].id;

    // Act
    useWorkoutStore.getState().deleteRepetitionBlock(blockId);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: nextId,
    });
  });

  it("falls back to empty-state when the block was the only item", () => {
    // Arrange
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([{ repeatCount: 2, steps: [step(0)] }]));
    const blockId = (
      useWorkoutStore.getState().currentWorkout!.extensions!
        .structured_workout as { steps: Array<{ id: string }> }
    ).steps[0].id;

    // Act
    useWorkoutStore.getState().deleteRepetitionBlock(blockId);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "empty-state",
    });
  });
});
