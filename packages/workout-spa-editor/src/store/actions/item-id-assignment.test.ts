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

  it("loadWorkout hydrates every step with a distinct ItemId", () => {
    useWorkoutStore
      .getState()
      .loadWorkout(buildKrd([baseStep, { ...baseStep, stepIndex: 1 }]));

    const steps = innerSteps();
    const ids = steps.map((s) => (s as { id?: string }).id);

    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("createStep assigns a fresh ItemId to the new step", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const [originalId] = innerSteps().map((s) => (s as { id?: string }).id);

    useWorkoutStore.getState().createStep();
    const ids = innerSteps().map((s) => (s as { id?: string }).id);

    expect(ids).toHaveLength(2);
    expect(ids[1]).toBeDefined();
    expect(ids[1]).not.toBe(originalId);
  });

  it("duplicateStep assigns a fresh ItemId to the duplicate", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const originalId = (innerSteps()[0] as { id: string }).id;

    useWorkoutStore.getState().duplicateStep(0);
    const [firstId, duplicateId] = innerSteps().map(
      (s) => (s as { id?: string }).id
    );

    expect(firstId).toBe(originalId);
    expect(duplicateId).toBeDefined();
    expect(duplicateId).not.toBe(originalId);
  });

  it("createEmptyRepetitionBlock assigns an ItemId to the new block and its default step", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));

    useWorkoutStore.getState().createEmptyRepetitionBlock(3);

    const steps = innerSteps();
    const block = steps[steps.length - 1] as RepetitionBlock & { id: string };

    expect(isRepetitionBlock(block)).toBe(true);
    expect(block.id).toBeDefined();
    expect(block.steps[0]).toMatchObject({ id: expect.any(String) });
  });

  it("addStepToRepetitionBlock assigns an ItemId to the new nested step", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    useWorkoutStore.getState().createEmptyRepetitionBlock(2);
    const block = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock & { id: string };

    useWorkoutStore.getState().addStepToRepetitionBlock(block.id);

    const updatedBlock = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock;
    expect(updatedBlock.steps).toHaveLength(2);
    expect(updatedBlock.steps[1]).toMatchObject({ id: expect.any(String) });
    expect((updatedBlock.steps[0] as { id: string }).id).not.toBe(
      (updatedBlock.steps[1] as { id: string }).id
    );
  });

  it("duplicateStepInRepetitionBlock assigns a fresh ItemId to the duplicate", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    useWorkoutStore.getState().createEmptyRepetitionBlock(2);
    const block = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock & { id: string };

    useWorkoutStore.getState().duplicateStepInRepetitionBlock(block.id, 0);

    const updatedBlock = innerSteps().find((s) =>
      isRepetitionBlock(s)
    ) as RepetitionBlock;
    expect(updatedBlock.steps).toHaveLength(2);
    expect((updatedBlock.steps[0] as { id: string }).id).not.toBe(
      (updatedBlock.steps[1] as { id: string }).id
    );
  });

  it("pasteStep regenerates ids on the pasted payload (trust boundary)", async () => {
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

    const ids = innerSteps().map((s) => (s as { id?: string }).id);
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

  it("undoDelete restores the same ItemId the user saw before deletion", () => {
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
    const restoredIds = innerSteps().map((s) => (s as { id: string }).id);

    expect(restoredIds).toEqual([firstId, secondId]);
  });

  it("undo/redo traverse snapshots without losing ItemIds", () => {
    useWorkoutStore.getState().loadWorkout(buildKrd([baseStep]));
    const originalId = (innerSteps()[0] as { id: string }).id;

    useWorkoutStore.getState().createStep();
    const afterCreateIds = innerSteps().map((s) => (s as { id: string }).id);

    useWorkoutStore.getState().undo();
    const afterUndoIds = innerSteps().map((s) => (s as { id: string }).id);
    expect(afterUndoIds).toEqual([originalId]);

    useWorkoutStore.getState().redo();
    const afterRedoIds = innerSteps().map((s) => (s as { id: string }).id);
    expect(afterRedoIds).toEqual(afterCreateIds);
  });
});
