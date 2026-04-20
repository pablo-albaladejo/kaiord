import { beforeEach, describe, expect, it, vi } from "vitest";

import { asItemId } from "./providers/item-id";
import type { UIWorkout } from "./workout-state.types";
import { pushHistorySnapshot } from "./workout-store-history";

const makeWorkout = (version: string): UIWorkout =>
  ({
    version,
    type: "structured_workout",
    metadata: { sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "w",
        sport: "cycling",
        steps: [],
      },
    },
  }) as unknown as UIWorkout;

describe("pushHistorySnapshot", () => {
  const baseState = {
    workoutHistory: [] as Array<UIWorkout>,
    historyIndex: -1,
    selectionHistory: [] as Array<ReturnType<typeof asItemId> | null>,
  };

  it("appends workout + selection and bumps historyIndex", () => {
    const a = makeWorkout("a");

    const result = pushHistorySnapshot(a, asItemId("s1"), baseState);

    expect(result.workoutHistory).toEqual([a]);
    expect(result.selectionHistory).toEqual([asItemId("s1")]);
    expect(result.historyIndex).toBe(0);
  });

  it("keeps workoutHistory.length === selectionHistory.length across pushes", () => {
    const a = makeWorkout("a");
    const b = makeWorkout("b");

    const first = pushHistorySnapshot(a, null, baseState);
    const second = pushHistorySnapshot(b, asItemId("s1"), first);

    expect(second.workoutHistory).toHaveLength(second.selectionHistory.length);
  });

  it("captures the pre-mutation selection as the last selection entry", () => {
    const a = makeWorkout("a");
    const b = makeWorkout("b");

    const first = pushHistorySnapshot(a, asItemId("before"), baseState);
    const second = pushHistorySnapshot(b, asItemId("after"), first);

    expect(second.selectionHistory[0]).toBe(asItemId("before"));
    expect(second.selectionHistory[1]).toBe(asItemId("after"));
  });

  it("drops redo-future entries when pushing past the current historyIndex", () => {
    const a = makeWorkout("a");
    const b = makeWorkout("b");
    const c = makeWorkout("c");

    const afterB = pushHistorySnapshot(
      b,
      asItemId("sb"),
      pushHistorySnapshot(a, asItemId("sa"), baseState)
    );
    // Simulate undo by rewinding historyIndex, then push c.
    const rewound = {
      ...afterB,
      historyIndex: 0,
    };

    const result = pushHistorySnapshot(c, asItemId("sc"), rewound);

    expect(result.workoutHistory).toEqual([a, c]);
    expect(result.selectionHistory).toEqual([asItemId("sa"), asItemId("sc")]);
    expect(result.historyIndex).toBe(1);
  });

  it("caps history at MAX_HISTORY_SIZE preserving parallel lengths", () => {
    let state = { ...baseState };
    for (let i = 0; i < 60; i++) {
      state = pushHistorySnapshot(
        makeWorkout(`v${i}`),
        asItemId(`s${i}`),
        state
      );
    }

    expect(state.workoutHistory).toHaveLength(50);
    expect(state.selectionHistory).toHaveLength(50);
    expect(state.workoutHistory[0].version).toBe("v10");
    expect(state.selectionHistory[0]).toBe(asItemId("s10"));
  });

  it("defaults selectionHistory to [] if the caller state omits it", () => {
    const a = makeWorkout("a");
    const loose = { workoutHistory: [] as Array<UIWorkout>, historyIndex: -1 };

    const result = pushHistorySnapshot(a, null, loose);

    expect(result.selectionHistory).toEqual([null]);
  });

  describe("dev-mode invariant assertion", () => {
    it("logs when a malformed caller desynchronises the arrays", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "test");
      const a = makeWorkout("a");
      const desync = {
        workoutHistory: [a, a, a],
        historyIndex: 2,
        selectionHistory: [null], // shorter than workoutHistory
      };

      pushHistorySnapshot(a, null, desync);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it("is silent in production", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubEnv("NODE_ENV", "production");
      const a = makeWorkout("a");
      const desync = {
        workoutHistory: [a, a, a],
        historyIndex: 2,
        selectionHistory: [null],
      };

      pushHistorySnapshot(a, null, desync);

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });
});
