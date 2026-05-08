/**
 * Item-id assignment contracts for store mutations.
 *
 * Covers proposal §2.1.a: `createStep`, `createEmptyRepetitionBlock`,
 * `addStepToRepetitionBlock`, `duplicateStep`,
 * `duplicateStepInRepetitionBlock`, and `pasteStep` all emit items with a
 * fresh, distinct `ItemId`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

const baseStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 200 } },
};

const buildKrd = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      sport: "cycling",
      steps,
    } as Workout,
  },
});

const innerSteps = (): Array<WorkoutStep | RepetitionBlock> => {
  const workout =
    useWorkoutStore.getState().currentWorkout?.extensions?.structured_workout;
  return (workout as Workout | undefined)?.steps ?? [];
};

describe("store mutations assign fresh ItemIds", () => {
  afterEach(() => {
    // Always unstub — a failing assertion inside a test must not leak a
    // stubbed `navigator` (clipboard) into the next test.
    vi.unstubAllGlobals();
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("should hydrate every step with a distinct ItemId via loadWorkout", () => {
    // Arrange
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([baseStep, { ...baseStep, stepIndex: 1 }]));
    const steps = innerSteps();

    // Act
    const ids = steps.map((s) => (s as { id?: string }).id);

    // Assert
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should assign a fresh ItemId to the new step via createStep", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const [originalId] = innerSteps().map((s) => (s as { id?: string }).id);
    useWorkoutStore.getState().createStep();

    // Act
    const ids = innerSteps().map((s) => (s as { id?: string }).id);

    // Assert
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBeDefined();
    expect(ids[1]).not.toBe(originalId);
  });

  it("should assign a fresh ItemId to the duplicate via duplicateStep", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const originalId = (innerSteps()[0] as { id: string }).id;
    useWorkoutStore.getState().duplicateStep(0);

    // Act
    const [firstId, duplicateId] = innerSteps().map(
      (s) => (s as { id?: string }).id
    );

    // Assert
    expect(firstId).toBe(originalId);
    expect(duplicateId).toBeDefined();
    expect(duplicateId).not.toBe(originalId);
  });

  it("should assign an ItemId to the new block and its default step via createEmptyRepetitionBlock", () => {
    // Arrange
    const REPETITIONS = 3;
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    useWorkoutStore.getState().createEmptyRepetitionBlock(REPETITIONS);
    const steps = innerSteps();

    // Act
    const block = steps[steps.length - 1] as RepetitionBlock & { id: string };

    // Assert
    expect(isRepetitionBlock(block)).toBe(true);
    expect(block.id).toBeDefined();
    expect(block.steps[0]).toMatchObject({ id: expect.any(String) });
  });

  it("should assign an ItemId to the new nested step via addStepToRepetitionBlock", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    useWorkoutStore.getState().createEmptyRepetitionBlock(2);
    const block = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock & { id: string };
    useWorkoutStore.getState().addStepToRepetitionBlock(block.id);

    // Act
    const updatedBlock = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock;

    // Assert
    expect(updatedBlock.steps).toHaveLength(2);
    expect(updatedBlock.steps[1]).toMatchObject({ id: expect.any(String) });
    expect((updatedBlock.steps[0] as { id: string }).id).not.toBe(
      (updatedBlock.steps[1] as { id: string }).id
    );
  });

  it("should assign a fresh ItemId to the duplicate via duplicateStepInRepetitionBlock", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    useWorkoutStore.getState().createEmptyRepetitionBlock(2);
    const block = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock & { id: string };
    useWorkoutStore.getState().duplicateStepInRepetitionBlock(block.id, 0);

    // Act
    const updatedBlock = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock;

    // Assert
    expect(updatedBlock.steps).toHaveLength(2);
    expect((updatedBlock.steps[0] as { id: string }).id).not.toBe(
      (updatedBlock.steps[1] as { id: string }).id
    );
  });

  it("should regenerate ids on the pasted payload via pasteStep (trust boundary)", async () => {
    // Arrange
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
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    await useWorkoutStore.getState().pasteStep();

    // Act
    const ids = innerSteps().map((s) => (s as { id?: string }).id);

    // Assert
    expect(ids).toHaveLength(2);
    expect(ids).not.toContain("attacker-supplied-id");
  });
});

describe("undoDelete + undo/redo preserve item ids", () => {
  afterEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      deletedSteps: [],
    });
  });

  it("should restore the same ItemId the user saw before deletion via undoDelete", () => {
    // Arrange
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([baseStep, { ...baseStep, stepIndex: 1 }]));
    const [firstId, secondId] = innerSteps().map(
      (s) => (s as { id: string }).id
    );
    useWorkoutStore.getState().deleteStep(1);
    const deleted = useWorkoutStore.getState().deletedSteps ?? [];
    expect(deleted).toHaveLength(1);
    const [deletedEntry] = deleted;
    if (!deletedEntry) throw new Error("Expected one deleted step");
    useWorkoutStore.getState().undoDelete(deletedEntry.timestamp);

    // Act
    const restoredIds = innerSteps().map((s) => (s as { id: string }).id);

    // Assert
    expect(restoredIds).toEqual([firstId, secondId]);
  });

  it("should traverse snapshots without losing ItemIds via undo/redo", () => {
    // Arrange
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const originalId = (innerSteps()[0] as { id: string }).id;
    useWorkoutStore.getState().createStep();
    const afterCreateIds = innerSteps().map((s) => (s as { id: string }).id);
    useWorkoutStore.getState().undo();
    const afterUndoIds = innerSteps().map((s) => (s as { id: string }).id);
    expect(afterUndoIds).toEqual([originalId]);
    useWorkoutStore.getState().redo();

    // Act
    const afterRedoIds = innerSteps().map((s) => (s as { id: string }).id);

    // Assert
    expect(afterRedoIds).toEqual(afterCreateIds);
  });
});
