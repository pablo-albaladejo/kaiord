import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeWorkoutRecord } from "../../application/test-helpers";

const route = { active: true as boolean | undefined };
vi.mock("../../contexts", () => ({
  useAnalytics: () => ({ event: vi.fn() }),
  useGarminBridge: () => ({
    extensionInstalled: true,
    sessionActive: true,
    features: [],
  }),
}));
vi.mock("../../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
type Handlers = {
  isCancelled: () => boolean;
  onOutcome: (o: unknown) => void;
};
const items = { started: [] as string[], release: () => {} };
// The runner's contract: it checks the cancel flag before each item.
vi.mock("../../hooks/send-week/send-week-run", () => ({
  runSendWeek: async (
    _c: unknown,
    candidates: { workoutId: string }[],
    h: Handlers
  ) => {
    for (const c of candidates) {
      if (h.isCancelled()) return { outcomes: [], cancelled: true };
      items.started.push(c.workoutId);
      await new Promise<void>((r) => (items.release = r));
      h.onOutcome({ ...c, status: "scheduled" });
    }
    return { outcomes: [], cancelled: false };
  },
}));
vi.mock("../../hooks/use-garmin-export-route", () => ({
  useGarminExportRoute: () => route.active,
}));

import { useCalendarSendWeek } from "./use-calendar-send-week";

const WEEK = { "2026-10-05": [makeWorkoutRecord({ date: "2026-10-05" })] };

describe("useCalendarSendWeek", () => {
  it.each([
    { name: "a route and a workout", active: true, week: WEEK, offered: true },
    { name: "no route", active: false, week: WEEK, offered: false },
    { name: "a loading route", active: undefined, week: WEEK, offered: false },
    { name: "an empty week", active: true, week: {}, offered: false },
  ])(
    "should decide Send week is offered for $name: $offered",
    ({ active, week, offered }) => {
      // Arrange
      route.active = active;

      // Act
      const { result } = renderHook(() =>
        useCalendarSendWeek("p1", "2026-W41", week)
      );

      // Assert
      expect(result.current.offered).toBe(offered);
    }
  );

  it("should stop the run and not show its panel on a week change", async () => {
    // Arrange
    route.active = true;
    const twoDays = {
      "2026-10-05": [makeWorkoutRecord({ id: "w-1", date: "2026-10-05" })],
      "2026-10-06": [makeWorkoutRecord({ id: "w-2", date: "2026-10-06" })],
    };
    const { result, rerender } = renderHook(
      ({ weekId }) => useCalendarSendWeek("p1", weekId, twoDays),
      { initialProps: { weekId: "2026-W41" } }
    );
    let running: Promise<void> | undefined;
    act(() => void (running = result.current.startWeek()));

    // Act
    rerender({ weekId: "2026-W42" });
    await act(async () => {
      items.release();
      await running;
    });

    // Assert
    expect(items.started).toEqual(["w-1"]);
    expect(result.current.state).toEqual({ phase: "idle" });
  });
});
