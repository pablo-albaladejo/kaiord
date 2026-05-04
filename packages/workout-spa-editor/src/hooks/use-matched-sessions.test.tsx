import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import { useMatchedSessions } from "./use-matched-sessions";

const WEEK = [
  "2026-04-27",
  "2026-04-28",
  "2026-04-29",
  "2026-04-30",
  "2026-05-01",
  "2026-05-02",
  "2026-05-03",
];

const seedActivity = (
  id: string,
  profileId: string,
  date: string
): CoachingActivityRecord => ({
  id,
  profileId,
  source: "train2go",
  sourceId: id.split(":").pop() ?? id,
  date,
  sport: "cycling",
  title: "FTP test",
  duration: "60 min",
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
});

const seedWorkout = (
  id: string,
  date: string,
  durationSeconds = 3540
): WorkoutRecord =>
  ({
    id,
    date,
    sport: "cycling",
    source: "train2go",
    state: "ready",
    raw: { title: "FTP", duration: { value: durationSeconds, unit: "s" } },
  }) as unknown as WorkoutRecord;

const seedMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "M1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w-1",
  date: "2026-04-29",
  createdAt: "2026-04-30T10:00:00.000Z",
  source: "manual",
  ...overrides,
});

const clearAll = () =>
  Promise.all([
    db.table("sessionMatches").clear(),
    db.table("coachingActivities").clear(),
    db.table("workouts").clear(),
  ]);

describe("useMatchedSessions", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should return [] when no profileId or empty days", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useMatchedSessions(null, WEEK));

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should return [] when no matches exist", async () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should hydrate matches with activity, workout, and compliance score", async () => {
    // Arrange
    await db
      .table("coachingActivities")
      .put(seedActivity("p1:train2go:1", "p1", "2026-04-29"));
    await db.table("workouts").put(seedWorkout("w-1", "2026-04-29", 3540));
    await db.table("sessionMatches").put(seedMatch());
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    // Act
    const ms = result.current![0]!;

    // Assert
    expect(ms.match.id).toBe("M1");
    expect(ms.activity.title).toBe("FTP test");
    expect(ms.workout.id).toBe("w-1");
    expect(ms.complianceScore).toBeCloseTo(0.983, 2);
  });

  it("should filter out matches outside the week range", async () => {
    // Arrange
    await db
      .table("coachingActivities")
      .put(seedActivity("p1:train2go:1", "p1", "2026-04-20"));
    await db.table("workouts").put(seedWorkout("w-1", "2026-04-20", 3600));
    await db.table("sessionMatches").put(seedMatch({ date: "2026-04-20" }));

    // Act
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should scope to profile (other profiles' matches do not leak)", async () => {
    // Arrange
    await db
      .table("coachingActivities")
      .put(seedActivity("p2:train2go:9", "p2", "2026-04-29"));
    await db.table("workouts").put(seedWorkout("w-9", "2026-04-29"));
    await db.table("sessionMatches").put(
      seedMatch({
        id: "M2",
        profileId: "p2",
        coachingActivityId: "p2:train2go:9",
        workoutId: "w-9",
      })
    );

    // Act
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should tolerate dangling references (skips if activity or workout missing)", async () => {
    // Arrange
    await db.table("sessionMatches").put(seedMatch());

    // Act
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));

    // Assert
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("should re-evaluate when a new match is written", async () => {
    // Arrange
    await db
      .table("coachingActivities")
      .put(seedActivity("p1:train2go:1", "p1", "2026-04-29"));
    await db.table("workouts").put(seedWorkout("w-1", "2026-04-29"));
    const { result } = renderHook(() => useMatchedSessions("p1", WEEK));
    await waitFor(() => expect(result.current).toEqual([]));

    // Act
    await db.table("sessionMatches").put(seedMatch());

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
  });
});
