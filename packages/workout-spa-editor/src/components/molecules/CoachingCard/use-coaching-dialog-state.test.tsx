/**
 * useCoachingDialogState — matched-state must populate `executed` from
 * `match.executedWorkoutIds`. Seeds the shared Dexie database (fake
 * IndexedDB) with a SessionMatch + 1 structured workout + 2 executed
 * workouts, then asserts `kind === "matched"` carries both the
 * structured workout and the two executed records.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { toPersistedCoachingActivityId } from "../../../types/coaching-activity-record";
import type { SessionMatch } from "../../../types/session-match";
import { useCoachingDialogState } from "./use-coaching-dialog-state";

const PROFILE_ID = "p1";
const ACTIVITY_ID = "train2go:abc";
const PERSISTED_ACTIVITY_ID = toPersistedCoachingActivityId(
  PROFILE_ID,
  ACTIVITY_ID
);

const activity: CoachingActivity = {
  id: ACTIVITY_ID,
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Sweet spot intervals",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "Body",
};

const makeWorkout = (id: string): WorkoutRecord =>
  ({
    id,
    profileId: PROFILE_ID,
    date: "2026-04-13",
    sport: "cycling",
    source: "train2go",
    sourceId: id,
    state: "structured",
    raw: { title: id, duration: { value: 3600, unit: "s" } },
  }) as unknown as WorkoutRecord;

const makeMatch = (
  workoutId: string,
  executedWorkoutIds: string[]
): SessionMatch => ({
  id: "M-1",
  profileId: PROFILE_ID,
  coachingActivityId: PERSISTED_ACTIVITY_ID,
  workoutId,
  date: "2026-04-13",
  createdAt: "2026-05-01T12:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds,
});

afterEach(async () => {
  await db.table("sessionMatches").clear();
  await db.table("workouts").clear();
});

describe("useCoachingDialogState — matched executed", () => {
  it("should populate executed from match.executedWorkoutIds", async () => {
    // Arrange
    const structured = makeWorkout("w-structured");
    const exec1 = makeWorkout("w-exec-1");
    const exec2 = makeWorkout("w-exec-2");
    await db.table("workouts").bulkPut([structured, exec1, exec2]);
    await db
      .table("sessionMatches")
      .put(makeMatch(structured.id, [exec1.id, exec2.id]));

    // Act
    const { result } = renderHook(() =>
      useCoachingDialogState(PROFILE_ID, activity)
    );

    // Assert
    await waitFor(() => expect(result.current?.kind).toBe("matched"));
    const state = result.current;
    if (state?.kind !== "matched") throw new Error("expected matched");
    expect(state.workout.id).toBe(structured.id);
    expect(state.executed.map((w) => w.id)).toEqual([exec1.id, exec2.id]);
  });

  it("should return empty executed array when no executedWorkoutIds are set", async () => {
    // Arrange
    const structured = makeWorkout("w-structured");
    await db.table("workouts").bulkPut([structured]);
    await db.table("sessionMatches").put(makeMatch(structured.id, []));

    // Act
    const { result } = renderHook(() =>
      useCoachingDialogState(PROFILE_ID, activity)
    );

    // Assert
    await waitFor(() => expect(result.current?.kind).toBe("matched"));
    const state = result.current;
    if (state?.kind !== "matched") throw new Error("expected matched");
    expect(state.executed).toEqual([]);
  });

  it("should drop dangling executed ids that point to deleted workouts", async () => {
    // Arrange
    const structured = makeWorkout("w-structured");
    const exec1 = makeWorkout("w-exec-1");
    await db.table("workouts").bulkPut([structured, exec1]);
    await db
      .table("sessionMatches")
      .put(makeMatch(structured.id, [exec1.id, "w-missing"]));

    // Act
    const { result } = renderHook(() =>
      useCoachingDialogState(PROFILE_ID, activity)
    );

    // Assert
    await waitFor(() => expect(result.current?.kind).toBe("matched"));
    const state = result.current;
    if (state?.kind !== "matched") throw new Error("expected matched");
    expect(state.executed.map((w) => w.id)).toEqual([exec1.id]);
  });
});
