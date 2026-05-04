/**
 * Tests for the refactored undoHistory structure (Phase B hardening).
 * Replaces parallel-array semantics with single HistoryEntry array.
 */
import { afterEach, describe, expect, it } from "vitest";

import type { UIWorkout } from "../types/krd-ui";
import { asItemId } from "./providers/item-id";
import type { HistoryEntry, UndoHistory } from "./workout-state.types";
import { useWorkoutStore } from "./workout-store";
import { pushHistorySnapshot } from "./workout-store-history";

const makeUI = (marker: string): UIWorkout =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    extensions: {
      structured_workout: { sport: "cycling", steps: [], __marker: marker },
    },
  }) as unknown as UIWorkout;

// Task 4.1.a — HistoryEntry shape and undoHistory typing
describe("HistoryEntry type shape", () => {
  it("should expose HistoryEntry as an object with workout and selection fields", () => {
    const entry: HistoryEntry = {
      workout: makeUI("a"),
      selection: asItemId("sel-1"),
    };

    expect(entry.workout).toBeDefined();
    expect(entry.selection).toBe("sel-1");
  });

  it("should allow HistoryEntry selection to be null", () => {
    const entry: HistoryEntry = { workout: makeUI("b"), selection: null };

    expect(entry.selection).toBeNull();
  });

  it("should expose UndoHistory as an array of HistoryEntry", () => {
    const history: UndoHistory = [
      { workout: makeUI("a"), selection: null },
      { workout: makeUI("b"), selection: asItemId("sel-1") },
    ];

    expect(history).toHaveLength(2);
    expect(history[1].selection).toBe("sel-1");
  });
});

// Task 4.2.a — pushHistorySnapshot 1-arg signature
describe("pushHistorySnapshot (1-arg HistoryEntry form)", () => {
  it("should accept a single HistoryEntry and pushes atomically", () => {
    const entry: HistoryEntry = {
      workout: makeUI("a"),
      selection: asItemId("sel-1"),
    };

    const result = pushHistorySnapshot(
      { undoHistory: [], historyIndex: -1 },
      entry
    );

    expect(result.undoHistory).toHaveLength(1);
    expect(result.undoHistory[0].workout).toEqual(entry.workout);
    expect(result.undoHistory[0].selection).toBe("sel-1");
    expect(result.historyIndex).toBe(0);
  });

  it("should keep undoHistory entries parallel (no length drift possible)", () => {
    const state0 = { undoHistory: [] as UndoHistory, historyIndex: -1 };
    const r1 = pushHistorySnapshot(state0, {
      workout: makeUI("a"),
      selection: null,
    });
    const r2 = pushHistorySnapshot(
      { undoHistory: r1.undoHistory, historyIndex: r1.historyIndex },
      { workout: makeUI("b"), selection: asItemId("sel-2") }
    );

    expect(r2.undoHistory).toHaveLength(2);
    expect(r2.undoHistory[0].selection).toBeNull();
    expect(r2.undoHistory[1].selection).toBe("sel-2");
  });

  it("should truncate to 50 entries, keeping the most recent tail", () => {
    let state = { undoHistory: [] as UndoHistory, historyIndex: -1 };
    for (let i = 0; i < 52; i++) {
      state = pushHistorySnapshot(state, {
        workout: makeUI(`w-${i}`),
        selection: null,
      });
    }

    expect(state.undoHistory.length).toBe(50);
    const tail = state.undoHistory.at(-1)!.workout as unknown as {
      extensions: { structured_workout: { __marker: string } };
    };
    expect(tail.extensions.structured_workout.__marker).toBe("w-51");
  });
});

// Task 4.3.a — undo reads undoHistory[i].workout and .selection
describe("WorkoutStore undo/redo with undoHistory", () => {
  afterEach(() => {
    useWorkoutStore.setState({ undoHistory: [], historyIndex: -1 });
  });

  it("should keep WorkoutStore initial state with undoHistory as empty array", () => {
    expect(useWorkoutStore.getState().undoHistory).toEqual([]);
  });

  it("should read the paired {workout, selection} from undoHistory on undo", () => {
    const workout0 = makeUI("initial");
    const workout1 = makeUI("after-mutation");
    const selId = asItemId("step-abc");

    useWorkoutStore.setState({
      currentWorkout: workout1,
      undoHistory: [
        { workout: workout0, selection: null },
        { workout: workout1, selection: selId },
      ],
      historyIndex: 1,
    });

    useWorkoutStore.getState().undo();
    const s = useWorkoutStore.getState();
    expect(s.currentWorkout).toEqual(workout0);
    expect(s.historyIndex).toBe(0);
  });
});

// Task 4.4.a — clearWorkout resets undoHistory to [] and historyIndex to -1
describe("clearWorkout resets undoHistory", () => {
  afterEach(() => {
    useWorkoutStore.setState({ undoHistory: [], historyIndex: -1 });
  });

  it("should reset undoHistory to empty array and historyIndex to -1", () => {
    useWorkoutStore.setState({
      undoHistory: [{ workout: makeUI("x"), selection: null }],
      historyIndex: 0,
    });

    useWorkoutStore.getState().clearWorkout();

    const s = useWorkoutStore.getState();
    expect(s.undoHistory).toEqual([]);
    expect(s.historyIndex).toBe(-1);
  });
});
