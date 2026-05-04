/**
 * useMatchSession — wires the matchSession use case through
 * `usePersistence()` + `persistence.transaction(...)`. Asserts that
 * every repository the use case needs is sourced from the injected
 * persistence (no direct `db` imports).
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../contexts/persistence-context";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../types/coaching-activity-record";
import { useMatchSession } from "./use-match-session";

const NOW = "2026-04-28T10:00:00.000Z";
const PROFILE = "p1";

const makeActivity = (): CoachingActivityRecord => ({
  id: buildCoachingActivityId(PROFILE, "train2go", "12345"),
  profileId: PROFILE,
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "Z2 60'",
  status: "pending",
  fetchedAt: NOW,
});

const makeWorkout = (): WorkoutRecord =>
  ({
    id: "w-1",
    date: "2026-04-13",
    sport: "cycling",
    state: "raw",
    raw: { description: "x" },
  }) as unknown as WorkoutRecord;

describe("useMatchSession", () => {
  it("should create a SessionMatch row through the injected PersistencePort", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const activity = makeActivity();
    const workout = makeWorkout();
    await persistence.coaching.put(activity);
    await persistence.workouts.put(workout);
    const wrap = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );
    const { result } = renderHook(() => useMatchSession(), { wrapper: wrap });
    await act(async () => {
      await result.current({
        profileId: PROFILE,
        coachingActivityId: activity.id,
        workoutId: workout.id,
        source: "manual",
      });
    });

    // Act
    const stored = await persistence.sessionMatch.getByActivityId(
      PROFILE,
      activity.id
    );

    // Assert
    expect(stored).toBeDefined();
    expect(stored?.workoutId).toBe(workout.id);
    expect(stored?.source).toBe("manual");
    expect(stored?.profileId).toBe(PROFILE);
  });

  it("should reject when the activity does not exist in the injected port", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.workouts.put(makeWorkout());
    const wrap = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );

    // Act
    const { result } = renderHook(() => useMatchSession(), { wrapper: wrap });

    // Assert
    await expect(
      result.current({
        profileId: PROFILE,
        coachingActivityId: "missing",
        workoutId: "w-1",
        source: "manual",
      })
    ).rejects.toThrow();
  });
});
