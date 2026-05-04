import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { AutoMatchDismissal } from "../types/auto-match-dismissal";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import { useAutoMatchSuggestions } from "./use-auto-match-suggestions";

const seedActivity = (
  date: string,
  duration = "60 min"
): CoachingActivityRecord => ({
  id: "p1:train2go:1",
  profileId: "p1",
  source: "train2go",
  sourceId: "1",
  date,
  sport: "cycling",
  title: "FTP test",
  duration,
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
});

const seedWorkout = (date: string, duration = 3600): WorkoutRecord =>
  ({
    id: "w-1",
    date,
    sport: "cycling",
    source: "manual",
    state: "ready",
    raw: { title: "FTP", duration: { value: duration, unit: "s" } },
  }) as unknown as WorkoutRecord;

const clearAll = () =>
  Promise.all([
    db.table("sessionMatches").clear(),
    db.table("coachingActivities").clear(),
    db.table("workouts").clear(),
    db.table("autoMatchDismissals").clear(),
  ]);

describe("useAutoMatchSuggestions", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should return [] when no profileId or weekStart", async () => {
    const { result } = renderHook(() =>
      useAutoMatchSuggestions(null, "2026-04-27")
    );
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should return [] when no candidates exist", async () => {
    const { result } = renderHook(() =>
      useAutoMatchSuggestions("p1", "2026-04-27")
    );
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should return suggestions when candidates exist and not dismissed", async () => {
    await db.table("coachingActivities").put(seedActivity("2026-04-29"));
    await db.table("workouts").put(seedWorkout("2026-04-29", 3600));

    const { result } = renderHook(() =>
      useAutoMatchSuggestions("p1", "2026-04-27")
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current![0]!.activityId).toBe("p1:train2go:1");
    });
  });

  it("should hide only the dismissed pair; other candidates remain visible", async () => {
    await db.table("coachingActivities").put(seedActivity("2026-04-29"));
    await db.table("workouts").put(seedWorkout("2026-04-29", 3600));
    const dismissedRow: AutoMatchDismissal = {
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedPairs: [
        {
          activityId: "p1:train2go:1",
          workoutId: "w-1",
          dismissedAt: new Date().toISOString(),
        },
      ],
    };
    await db.table("autoMatchDismissals").put(dismissedRow);

    const { result } = renderHook(() =>
      useAutoMatchSuggestions("p1", "2026-04-27")
    );

    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should re-evaluate when the dismissal entry is removed", async () => {
    await db.table("coachingActivities").put(seedActivity("2026-04-29"));
    await db.table("workouts").put(seedWorkout("2026-04-29", 3600));
    await db.table("autoMatchDismissals").put({
      profileId: "p1",
      weekStart: "2026-04-27",
      dismissedPairs: [
        {
          activityId: "p1:train2go:1",
          workoutId: "w-1",
          dismissedAt: new Date().toISOString(),
        },
      ],
    });

    const { result } = renderHook(() =>
      useAutoMatchSuggestions("p1", "2026-04-27")
    );
    await waitFor(() => expect(result.current).toEqual([]));

    await db.table("autoMatchDismissals").clear();

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
  });
});
