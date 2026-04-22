import { afterEach, describe, expect, it, vi } from "vitest";

import { useWorkoutStore } from "./workout-store";
import { pushHistorySnapshot } from "./workout-store-history";
import type { KRD, Workout } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";
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
  it("appends a workout + selection in sync", () => {
    const result = pushHistorySnapshot(
      { workoutHistory: [], historyIndex: -1, selectionHistory: [] },
      makeUI("a"),
      asItemId("sel-1")
    );
    expect(result.workoutHistory).toHaveLength(1);
    expect(result.selectionHistory).toEqual(["sel-1"]);
    expect(result.historyIndex).toBe(0);
  });

  it("keeps workoutHistory and selectionHistory exactly parallel", () => {
    const after1 = pushHistorySnapshot(
      { workoutHistory: [], historyIndex: -1, selectionHistory: [] },
      makeUI("a"),
      null
    );
    const after2 = pushHistorySnapshot(
      {
        workoutHistory: after1.workoutHistory,
        historyIndex: after1.historyIndex,
        selectionHistory: after1.selectionHistory,
      },
      makeUI("b"),
      asItemId("sel-2")
    );
    expect(after2.workoutHistory.length).toBe(after2.selectionHistory.length);
    expect(after2.selectionHistory).toEqual([null, "sel-2"]);
  });

  it("truncates future entries when pushing after an undo", () => {
    const afterA = pushHistorySnapshot(
      { workoutHistory: [], historyIndex: -1, selectionHistory: [] },
      makeUI("a"),
      null
    );
    const afterB = pushHistorySnapshot(
      {
        workoutHistory: afterA.workoutHistory,
        historyIndex: afterA.historyIndex,
        selectionHistory: afterA.selectionHistory,
      },
      makeUI("b"),
      asItemId("sel-b")
    );
    // User undoes to A (historyIndex=0), then makes a new push → future is truncated.
    const afterC = pushHistorySnapshot(
      {
        workoutHistory: afterB.workoutHistory,
        historyIndex: 0,
        selectionHistory: afterB.selectionHistory,
      },
      makeUI("c"),
      asItemId("sel-c")
    );
    expect(afterC.workoutHistory).toHaveLength(2);
    expect(afterC.selectionHistory).toEqual([null, "sel-c"]);
  });

  it("treats missing selectionHistory as empty and seeds [null] on first push", () => {
    const result = pushHistorySnapshot(
      // @ts-expect-error — deliberately omit selectionHistory to mirror pre-§4 test fixtures.
      { workoutHistory: [], historyIndex: -1 },
      makeUI("a"),
      null
    );
    expect(result.selectionHistory).toEqual([null]);
  });

  it("backfills selectionHistory with nulls when only history has a prefix", () => {
    // Legacy fixture: workoutHistory has entries but no selectionHistory.
    // The helper must return parallel arrays, not a short selection array.
    const result = pushHistorySnapshot(
      {
        workoutHistory: [makeUI("old-0"), makeUI("old-1")],
        historyIndex: 1,
        // selectionHistory omitted → backfill to [null, null] prefix.
      },
      makeUI("new"),
      null
    );
    expect(result.workoutHistory).toHaveLength(3);
    expect(result.selectionHistory).toEqual([null, null, null]);
  });

  it("trims both arrays together at MAX_HISTORY_SIZE (50)", () => {
    // Seed 50 entries, then push a 51st to trip the trim path.
    let state = {
      workoutHistory: [] as Array<UIWorkout>,
      historyIndex: -1,
      selectionHistory: [] as Array<string | null>,
    };
    for (let i = 0; i < 50; i++) {
      const next = pushHistorySnapshot(state, makeUI(`u${i}`), null);
      state = {
        workoutHistory: next.workoutHistory,
        historyIndex: next.historyIndex,
        selectionHistory: next.selectionHistory,
      };
    }
    const trimmed = pushHistorySnapshot(state, makeUI("overflow"), null);
    expect(trimmed.workoutHistory.length).toBe(50);
    expect(trimmed.selectionHistory.length).toBe(50);
    // The oldest entry was dropped; the new entry is at the tail.
    const tail = trimmed.workoutHistory.at(-1) as KRD;
    const inner = tail.extensions?.structured_workout as Workout & {
      __marker?: string;
    };
    expect(inner.__marker).toBe("overflow");
  });
});

describe("loadWorkout seeds selectionHistory parallel to workoutHistory", () => {
  afterEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      selectionHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("initialises selectionHistory with a single null entry", () => {
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
      extensions: {
        structured_workout: {
          sport: "cycling",
          steps: [],
        } as Workout,
      },
    };
    useWorkoutStore.getState().loadWorkout(krd);
    const state = useWorkoutStore.getState();
    expect(state.workoutHistory.length).toBe(state.selectionHistory.length);
    expect(state.selectionHistory).toEqual([null]);
  });
});

describe("structural drift prevention", () => {
  it("returns parallel arrays even when the input state omits selectionHistory entries", () => {
    // Legacy fixture: workoutHistory has 2 entries, historyIndex=1, but
    // selectionHistory is shorter (only 1 entry). The helper backfills
    // the missing slot with `null` so the returned arrays match length.
    const result = pushHistorySnapshot(
      {
        workoutHistory: [makeUI("x"), makeUI("y")],
        historyIndex: 1,
        selectionHistory: [null],
      },
      makeUI("z"),
      null
    );

    expect(result.workoutHistory.length).toBe(result.selectionHistory.length);
    expect(result.selectionHistory).toEqual([null, null, null]);
  });
});
