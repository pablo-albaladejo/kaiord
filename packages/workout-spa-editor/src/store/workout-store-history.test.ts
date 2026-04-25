import { afterEach, describe, expect, it } from "vitest";

import { useWorkoutStore } from "./workout-store";
import { pushHistorySnapshot } from "./workout-store-history";
import type { KRD, Workout } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";
import type { UndoHistory } from "./workout-state.types";
import { asItemId } from "./providers/item-id";

const makeUI = (marker: string): UIWorkout =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    extensions: {
      structured_workout: { sport: "cycling", steps: [], __marker: marker },
    },
  }) as unknown as UIWorkout;

describe("pushHistorySnapshot", () => {
  it("appends a HistoryEntry atomically", () => {
    const result = pushHistorySnapshot(
      { undoHistory: [], historyIndex: -1 },
      { workout: makeUI("a"), selection: asItemId("sel-1") }
    );
    expect(result.undoHistory).toHaveLength(1);
    expect(result.undoHistory[0].selection).toBe("sel-1");
    expect(result.historyIndex).toBe(0);
  });

  it("keeps workout and selection together in each entry", () => {
    const r1 = pushHistorySnapshot(
      { undoHistory: [], historyIndex: -1 },
      { workout: makeUI("a"), selection: null }
    );
    const r2 = pushHistorySnapshot(
      { undoHistory: r1.undoHistory, historyIndex: r1.historyIndex },
      { workout: makeUI("b"), selection: asItemId("sel-2") }
    );
    expect(r2.undoHistory).toHaveLength(2);
    expect(r2.undoHistory[0].selection).toBeNull();
    expect(r2.undoHistory[1].selection).toBe("sel-2");
  });

  it("truncates future entries when pushing after an undo", () => {
    const rA = pushHistorySnapshot(
      { undoHistory: [], historyIndex: -1 },
      { workout: makeUI("a"), selection: null }
    );
    const rB = pushHistorySnapshot(
      { undoHistory: rA.undoHistory, historyIndex: rA.historyIndex },
      { workout: makeUI("b"), selection: asItemId("sel-b") }
    );
    const rC = pushHistorySnapshot(
      { undoHistory: rB.undoHistory, historyIndex: 0 },
      { workout: makeUI("c"), selection: asItemId("sel-c") }
    );
    expect(rC.undoHistory).toHaveLength(2);
    expect(rC.undoHistory[0].selection).toBeNull();
    expect(rC.undoHistory[1].selection).toBe("sel-c");
  });

  it("trims at MAX_HISTORY_SIZE (50), keeping the most recent tail", () => {
    let state = { undoHistory: [] as UndoHistory, historyIndex: -1 };
    for (let i = 0; i < 50; i++) {
      state = pushHistorySnapshot(state, {
        workout: makeUI(`u${i}`),
        selection: null,
      });
    }
    const trimmed = pushHistorySnapshot(state, {
      workout: makeUI("overflow"),
      selection: null,
    });
    expect(trimmed.undoHistory.length).toBe(50);
    const tail = trimmed.undoHistory.at(-1)!.workout as KRD;
    const inner = tail.extensions?.structured_workout as Workout & {
      __marker?: string;
    };
    expect(inner.__marker).toBe("overflow");
  });
});

describe("loadWorkout seeds undoHistory with a single null-selection entry", () => {
  afterEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("initialises undoHistory with one entry and null selection", () => {
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
      extensions: {
        structured_workout: { sport: "cycling", steps: [] } as Workout,
      },
    };
    useWorkoutStore.getState().loadWorkout(krd);
    const state = useWorkoutStore.getState();
    expect(state.undoHistory).toHaveLength(1);
    expect(state.undoHistory[0].selection).toBeNull();
    expect(state.historyIndex).toBe(0);
  });
});
