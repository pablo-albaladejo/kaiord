import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { activityToWorkoutRecord } from "../../../application/coaching/activity-to-workout-record";
import { buildSourceActivityRecord } from "../../../types/activity-record";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useDailyEntryOpen } from "./use-daily-entry-open";

const FOCUS = "2026-06-10";
const REAL_TODAY = "2026-06-08";

const ACTIVITY: CoachingActivity = {
  id: "a-1",
  source: "train2go",
  sourceBadge: "T2G",
  date: FOCUS,
  sport: { label: "Cycling", icon: "bike" },
  title: "Intervals",
  status: "pending",
};

const workout = (o: Partial<WorkoutRecord>): WorkoutRecord =>
  ({ id: "w-1", date: FOCUS, sport: "cycling", ...o }) as WorkoutRecord;

const projectedActivityWorkout = () =>
  activityToWorkoutRecord(
    buildSourceActivityRecord({
      profileId: "p1",
      date: FOCUS,
      sport: "running",
      sourceBridgeId: "garmin-bridge",
      externalId: "ext-1",
    })
  );

function setup() {
  const { hook, history } = memoryLocation({ path: "/daily", record: true });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Router, { hook }, children);
  const { result } = renderHook(
    () => useDailyEntryOpen({ [FOCUS]: [ACTIVITY] }, FOCUS, REAL_TODAY),
    { wrapper }
  );
  return { result, history };
}

describe("useDailyEntryOpen", () => {
  it("should select a coaching activity instead of navigating", () => {
    // Arrange
    const { result, history } = setup();

    // Act
    act(() => result.current.handleActivityClick(ACTIVITY));

    // Assert
    expect(result.current.selectedActivity?.id).toBe("a-1");
    expect(history.at(-1)).toBe("/daily");
  });

  it("should open a raw workout in the dialog (no navigation)", () => {
    // Arrange
    const { result, history } = setup();

    // Act
    act(() => result.current.handleWorkoutClick(workout({ state: "raw" })));

    // Assert
    expect(result.current.selectedWorkout?.id).toBe("w-1");
    expect(history.at(-1)).toBe("/daily");
  });

  it("should navigate a ready workout to the editor with the daily origin", () => {
    // Arrange
    const { result, history } = setup();

    // Act
    act(() =>
      result.current.handleWorkoutClick(workout({ state: "structured" }))
    );

    // Assert
    expect(history.at(-1)).toBe("/workout/w-1?from=daily&date=2026-06-10");
  });

  it("should preview a projected activity instead of navigating to the editor", () => {
    // Arrange
    const { result, history } = setup();
    const activityWorkout = projectedActivityWorkout();

    // Act
    act(() => result.current.handleWorkoutClick(activityWorkout));

    // Assert
    expect(result.current.selectedWorkout?.id).toBe(activityWorkout.id);
    expect(history.at(-1)).toBe("/daily");
  });

  it("should clear the opposite selection so dialogs never overlap", () => {
    // Arrange
    const { result } = setup();

    // Act
    act(() => result.current.handleActivityClick(ACTIVITY));
    act(() => result.current.handleWorkoutClick(workout({ state: "raw" })));

    // Assert
    expect(result.current.selectedWorkout?.id).toBe("w-1");
    expect(result.current.selectedActivity).toBeNull();
  });

  it("should build a daily-origin process href carrying the focus date", () => {
    // Arrange
    const { result } = setup();

    // Act
    const href = result.current.buildProcessHref("w-9");

    // Assert
    expect(href).toBe("/workout/w-9?from=daily&date=2026-06-10");
  });
});
