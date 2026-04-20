import { describe, expect, it, vi } from "vitest";

import type { UIWorkout } from "../../types/krd-ui";
import { asItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-state.types";
import { addStepToRepetitionBlockAction } from "./add-step-to-repetition-block-action";
import { createEmptyRepetitionBlockAction } from "./create-empty-repetition-block-action";
import { createRepetitionBlockAction } from "./create-repetition-block-action";
import { createStepAction } from "./create-step-action";
import { deleteRepetitionBlockAction } from "./delete-repetition-block-action";
import { deleteStepAction } from "./delete-step-action";
import { duplicateStepAction } from "./duplicate-step-action";
import { duplicateStepInRepetitionBlockAction } from "./duplicate-step-in-repetition-block-action";
import { editRepetitionBlockAction } from "./edit-repetition-block-action";
import { createRedoAction, createUndoAction } from "./history-actions";
import { reorderStepAction } from "./reorder-step-action";
import { reorderStepsInBlockAction } from "./reorder-steps-in-block-action";
import { undoDeleteAction } from "./undo-delete-action";
import { ungroupRepetitionBlockAction } from "./ungroup-repetition-block-action";

const step = (id: string, stepIndex = 0) => ({
  id,
  stepIndex,
  durationType: "open" as const,
  duration: { type: "open" as const },
  targetType: "open" as const,
  target: { type: "open" as const },
});

const block = (id: string, steps: Array<ReturnType<typeof step>>) => ({
  id,
  repeatCount: 2,
  steps,
});

const makeWorkout = (items: Array<unknown>): UIWorkout =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "w",
        sport: "cycling",
        steps: items,
      },
    },
  }) as unknown as UIWorkout;

const makeState = (workout: UIWorkout): WorkoutState => ({
  currentWorkout: workout,
  workoutHistory: [workout],
  historyIndex: 0,
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  selectionHistory: [null],
});

describe("focus wiring on mutating actions", () => {
  it("deleteStep → nextAfterDelete (next sibling)", () => {
    const w = makeWorkout([step("a", 0), step("b", 1), step("c", 2)]);

    const out = deleteStepAction(w, 1, makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("c"),
    });
  });

  it("deleteStep → nextAfterDelete (previous sibling when last)", () => {
    const w = makeWorkout([step("a", 0), step("b", 1)]);

    const out = deleteStepAction(w, 1, makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("a"),
    });
  });

  it("deleteStep → empty-state when list becomes empty", () => {
    const w = makeWorkout([step("only", 0)]);

    const out = deleteStepAction(w, 0, makeState(w));

    expect(out.pendingFocusTarget).toEqual({ kind: "empty-state" });
  });

  it("deleteRepetitionBlock → nextAfterDelete", () => {
    const blk = block("blk", [step("b1", 0)]);
    const w = makeWorkout([step("a", 0), blk, step("c", 2)]);

    const out = deleteRepetitionBlockAction(w, "blk", makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("c"),
    });
  });

  it("createStep → pendingFocusTarget = new step id", () => {
    const w = makeWorkout([]);

    const out = createStepAction(w, makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
    if (out.pendingFocusTarget?.kind === "item") {
      expect(typeof out.pendingFocusTarget.id).toBe("string");
      expect(out.pendingFocusTarget.id.length).toBeGreaterThan(0);
    }
  });

  it("createEmptyRepetitionBlock → pendingFocusTarget = new block id", () => {
    const w = makeWorkout([]);

    const out = createEmptyRepetitionBlockAction(w, 2, makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("createRepetitionBlock → pendingFocusTarget = new block id", () => {
    const w = makeWorkout([step("a", 0), step("b", 1)]);

    const out = createRepetitionBlockAction(w, [0, 1], 3, makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("addStepToRepetitionBlock → pendingFocusTarget = new step id", () => {
    const blk = block("blk", [step("b1", 0)]);
    const w = makeWorkout([blk]);

    const out = addStepToRepetitionBlockAction(w, "blk", makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("duplicateStep → pendingFocusTarget = duplicated step id", () => {
    const w = makeWorkout([step("a", 0)]);

    const out = duplicateStepAction(w, 0, makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("duplicateStepInRepetitionBlock → pendingFocusTarget = duplicate id", () => {
    const blk = block("blk", [step("b1", 0)]);
    const w = makeWorkout([blk]);

    const out = duplicateStepInRepetitionBlockAction(w, "blk", 0, makeState(w));

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("ungroupRepetitionBlock → first formerly-child step id", () => {
    const blk = block("blk", [step("b1", 0), step("b2", 1)]);
    const w = makeWorkout([blk]);

    const out = ungroupRepetitionBlockAction(w, "blk", makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("b1"),
    });
  });

  it("editRepetitionBlock leaves pendingFocusTarget untouched", () => {
    const blk = block("blk", [step("b1", 0)]);
    const w = makeWorkout([blk]);

    const out = editRepetitionBlockAction(w, "blk", 5, makeState(w));

    expect("pendingFocusTarget" in out).toBe(false);
  });

  it("reorderStep → pendingFocusTarget = moved step id", () => {
    const w = makeWorkout([step("a", 0), step("b", 1), step("c", 2)]);

    const out = reorderStepAction(w, 0, 2, makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("a"),
    });
  });

  it("reorderStepsInBlock → pendingFocusTarget = moved step id", () => {
    const blk = block("blk", [step("b1", 0), step("b2", 1)]);
    const w = makeWorkout([blk]);

    const out = reorderStepsInBlockAction(w, "blk", 0, 1, makeState(w));

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("b1"),
    });
  });

  it("undoDelete → pendingFocusTarget = restored step id", () => {
    const restoredStep = step("restored", 0);
    const w = makeWorkout([step("a", 0)]);
    const stamp = 42;
    const state: WorkoutState = {
      ...makeState(w),
      deletedSteps: [
        { step: restoredStep as never, index: 1, timestamp: stamp },
      ],
    };

    const out = undoDeleteAction(w, stamp, state);

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("restored"),
    });
  });

  it("undo → preservedSelectionTarget using the captured prior selection", () => {
    const w0 = makeWorkout([step("a", 0)]);
    const w1 = makeWorkout([step("a", 0), step("b", 1)]);
    const state: WorkoutState = {
      currentWorkout: w1,
      workoutHistory: [w0, w1],
      historyIndex: 1,
      selectedStepId: "b",
      selectedStepIds: [],
      isEditing: false,
      selectionHistory: [null, asItemId("a")],
    };

    const out = createUndoAction(state);

    expect(out.pendingFocusTarget).toEqual({
      kind: "item",
      id: asItemId("a"),
    });
  });

  it("redo → preservedSelectionTarget on the restored snapshot", () => {
    const w0 = makeWorkout([step("a", 0)]);
    const w1 = makeWorkout([step("a", 0), step("b", 1)]);
    const state: WorkoutState = {
      currentWorkout: w0,
      workoutHistory: [w0, w1],
      historyIndex: 0,
      selectedStepId: "a",
      selectedStepIds: [],
      isEditing: false,
      selectionHistory: [null, asItemId("a")],
    };

    const out = createRedoAction(state);

    expect(out.pendingFocusTarget?.kind).toBe("item");
  });

  it("pasteStep → pendingFocusTarget = newly-generated pasted id", async () => {
    const clipboardMock = vi.fn().mockResolvedValue(
      JSON.stringify({
        stepIndex: 0,
        durationType: "open",
        duration: { type: "open" },
        targetType: "open",
        target: { type: "open" },
      })
    );
    vi.stubGlobal("navigator", {
      clipboard: { readText: clipboardMock },
    });

    const { pasteStepAction } = await import("./paste-step-action");
    const w = makeWorkout([step("a", 0)]);

    const out = await pasteStepAction(w);

    expect(out.success).toBe(true);
    expect(typeof out.newItemId).toBe("string");
    expect(out.newItemId?.length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});
