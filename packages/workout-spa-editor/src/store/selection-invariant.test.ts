/**
 * §8.8 single-parent selection invariant:
 * multi-selection cannot span the main list and the inside of a
 * repetition block, nor can it span two different blocks. Violating
 * toggles replace the selection rather than extend it.
 */

import { afterEach, describe, expect, it } from "vitest";

import type { KRD, RepetitionBlock, Workout } from "../types/krd";
import { useWorkoutStore } from "./workout-store";

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

const readInner = () =>
  useWorkoutStore.getState().currentWorkout!.extensions!.structured_workout as {
    steps: Array<{ id: string }>;
  };

const resetStore = () => {
  useWorkoutStore.setState({
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
    selectionHistory: [],
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    deletedSteps: [],
    pendingFocusTarget: null,
  });
};

describe("toggleStepSelection single-parent invariant", () => {
  afterEach(resetStore);

  it("extends the selection when toggling two main-list steps", () => {
    // Arrange — two top-level steps, no blocks.
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0), step(1)]));
    const [a, b] = readInner().steps;

    // Act
    useWorkoutStore.getState().toggleStepSelection(a.id);
    useWorkoutStore.getState().toggleStepSelection(b.id);

    // Assert — same-parent (main list) → extend.
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([a.id, b.id]);
  });

  it("extends the selection when toggling two nested steps in the same block", () => {
    // Arrange
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([{ repeatCount: 2, steps: [step(0), step(1)] }]));
    const block = readInner().steps[0] as unknown as RepetitionBlock;
    const [n0, n1] = block.steps as Array<{ id: string }>;

    // Act
    useWorkoutStore.getState().toggleStepSelection(n0.id);
    useWorkoutStore.getState().toggleStepSelection(n1.id);

    // Assert
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([n0.id, n1.id]);
  });

  it("replaces the selection when toggling mixes main-list + nested-step", () => {
    // Arrange — a top-level step plus a block with one nested step.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([step(0), { repeatCount: 2, steps: [step(0)] }]));
    const top = readInner().steps[0];
    const block = readInner().steps[1] as unknown as RepetitionBlock;
    const nested = block.steps[0] as { id: string };

    // Act — select the top-level first, then a nested step.
    useWorkoutStore.getState().toggleStepSelection(top.id);
    useWorkoutStore.getState().toggleStepSelection(nested.id);

    // Assert — the previous selection is dropped; only the nested id
    // remains (cross-parent toggle replaced rather than extended).
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([nested.id]);
  });

  it("replaces the selection when toggling mixes two different blocks", () => {
    // Arrange — two blocks, each with one nested step.
    useWorkoutStore.getState().loadWorkout(
      buildKrd([
        { repeatCount: 2, steps: [step(0)] },
        { repeatCount: 2, steps: [step(0)] },
      ])
    );
    const blockA = readInner().steps[0] as unknown as RepetitionBlock;
    const blockB = readInner().steps[1] as unknown as RepetitionBlock;
    const nestedA = (blockA.steps[0] as { id: string }).id;
    const nestedB = (blockB.steps[0] as { id: string }).id;

    // Act
    useWorkoutStore.getState().toggleStepSelection(nestedA);
    useWorkoutStore.getState().toggleStepSelection(nestedB);

    // Assert — cross-block toggle replaces.
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([nestedB]);
  });

  it("removes an already-selected id without triggering the replace branch", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0), step(1)]));
    const [a, b] = readInner().steps;
    useWorkoutStore.getState().toggleStepSelection(a.id);
    useWorkoutStore.getState().toggleStepSelection(b.id);

    // Act — deselect `a`.
    useWorkoutStore.getState().toggleStepSelection(a.id);

    // Assert
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([b.id]);
  });
});

describe("selectAllSteps single-parent invariant", () => {
  afterEach(resetStore);

  it("accepts a homogeneous set of main-list ids", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([step(0), step(1)]));
    const ids = readInner().steps.map((s) => s.id);

    // Act
    useWorkoutStore.getState().selectAllSteps(ids);

    // Assert
    expect(useWorkoutStore.getState().selectedStepIds).toEqual(ids);
  });

  it("filters out cross-parent ids, keeping only those sharing the first id's parent", () => {
    // Arrange — a top-level step and a nested step.
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([step(0), { repeatCount: 2, steps: [step(0)] }]));
    const topId = readInner().steps[0].id;
    const block = readInner().steps[1] as unknown as RepetitionBlock;
    const nestedId = (block.steps[0] as { id: string }).id;

    // Act — first id is the top-level, so we keep main-list ids only.
    useWorkoutStore.getState().selectAllSteps([topId, nestedId]);

    // Assert — nested id is dropped.
    expect(useWorkoutStore.getState().selectedStepIds).toEqual([topId]);
  });
});
