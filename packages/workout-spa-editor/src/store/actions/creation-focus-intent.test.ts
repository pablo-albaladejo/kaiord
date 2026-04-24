/**
 * Focus-intent tests for creation actions (§6.3–6.6).
 *
 * Every action that produces a new UIWorkoutItem sets
 * `pendingFocusTarget` to `createdItemTarget(newId)` so the new card
 * receives focus immediately after the commit.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
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

const readInner = () =>
  useWorkoutStore.getState().currentWorkout!.extensions!.structured_workout as {
    steps: Array<{ id: string }>;
  };

describe("creation-action focus intent (§6.3–6.6)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  it("createStep focuses the new step", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0)]));

    // Act
    useWorkoutStore.getState().createStep();

    // Assert
    const newId = readInner().steps[1].id;
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: newId,
    });
  });

  it("duplicateStep focuses the fresh duplicate", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0)]));
    const originalId = readInner().steps[0].id;

    // Act
    useWorkoutStore.getState().duplicateStep(0);

    // Assert
    const dupId = readInner().steps[1].id;
    expect(dupId).not.toBe(originalId);
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: dupId,
    });
  });

  it("createEmptyRepetitionBlock focuses the new block card", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0)]));

    // Act
    useWorkoutStore.getState().createEmptyRepetitionBlock(2);

    // Assert — the new block is the last item.
    const lastItem = readInner().steps.at(-1) as unknown as RepetitionBlock;
    expect(isRepetitionBlock(lastItem)).toBe(true);
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: lastItem.id,
    });
  });

  it("addStepToRepetitionBlock focuses the new nested step", () => {
    // Arrange — workout with one block containing a single step.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([{ repeatCount: 2, steps: [step(0)] }]));
    const blockId = readInner().steps[0].id;

    // Act
    useWorkoutStore.getState().addStepToRepetitionBlock(blockId);

    // Assert — focus target is the new nested step (not the block).
    const block = readInner().steps[0] as unknown as RepetitionBlock;
    const newNested = (block.steps[1] as { id: string }).id;
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: newNested,
    });
  });

  it("duplicateStepInRepetitionBlock focuses the duplicate", () => {
    // Arrange
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([{ repeatCount: 2, steps: [step(0)] }]));
    const blockId = readInner().steps[0].id;

    // Act
    useWorkoutStore.getState().duplicateStepInRepetitionBlock(blockId, 0);

    // Assert
    const block = readInner().steps[0] as unknown as RepetitionBlock;
    const dupId = (block.steps[1] as { id: string }).id;
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: dupId,
    });
  });

  it("createRepetitionBlock focuses the newly-wrapped block", () => {
    // Arrange — three top-level steps, select the first two to wrap.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([step(0), step(1), step(2)]));

    // Act — wrap stepIndices [0, 1] into a block (min 2 for wrap).
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);

    // Assert — the new block is at position 0.
    const block = readInner().steps[0] as unknown as RepetitionBlock;
    expect(isRepetitionBlock(block)).toBe(true);
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: block.id,
    });
  });

  it("pasteStep focuses the freshly-regenerated paste id, not the clipboard id", async () => {
    // Arrange — clipboard carries an attacker-supplied id.
    const clipboardStep = {
      id: "attacker-supplied-id",
      stepIndex: 99,
      durationType: "time",
      duration: { type: "time", seconds: 60 },
      targetType: "power",
      target: { type: "power", value: { unit: "watts", value: 150 } },
    };
    const readText = vi.fn(async () => JSON.stringify(clipboardStep));
    vi.stubGlobal("navigator", { clipboard: { readText } });

    useWorkoutStore.getState().loadWorkout(buildKrd([step(0)]));

    // Act
    await useWorkoutStore.getState().pasteStep();

    // Assert — focus lands on the regenerated id, never the attacker id.
    const inner = readInner();
    const target = useWorkoutStore.getState().pendingFocusTarget;
    // Must be an item target (empty-state would skip the id assertions).
    expect(target?.kind).toBe("item");
    if (!target || target.kind !== "item") {
      throw new Error("Expected pasteStep to focus the regenerated item");
    }
    expect(target.id).not.toBe("attacker-supplied-id");
    expect(inner.steps.some((s) => s.id === target.id)).toBe(true);
  });
});
