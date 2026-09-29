import { renderHook } from "@testing-library/react";
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
});
