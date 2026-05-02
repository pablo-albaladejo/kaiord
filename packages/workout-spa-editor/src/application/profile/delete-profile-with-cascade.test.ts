/**
 * deleteProfileWithCascade — application use case tests.
 */

import { describe, expect, it } from "vitest";

import { createInMemoryAutoMatchDismissalRepository } from "../../test-utils/in-memory-auto-match-dismissal-repository";
import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "../../test-utils/in-memory-coaching-sync-state-repository";
import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import { createInMemoryUserPreferencesRepository } from "../../test-utils/in-memory-user-preferences-repository";
import { createInMemoryWorkoutRepository } from "../../test-utils/in-memory-workout-repository";
import type { DeleteProfileWithCascadeDeps } from "./delete-profile-with-cascade";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import { deleteProfileWithCascade } from "./delete-profile-with-cascade";

const NOW = "2026-04-28T10:00:00.000Z";

const makeWorkout = (id: string): WorkoutRecord => ({
  id,
  date: "2026-04-13",
  sport: "cycling",
  source: "train2go",
  sourceId: `p1:${id}`,
  planId: null,
  state: "raw",
  raw: null,
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: NOW,
  modifiedAt: null,
  updatedAt: NOW,
});

const makeRecord = (
  profileId: string,
  sourceId: string
): CoachingActivityRecord => ({
  id: buildCoachingActivityId(profileId, "train2go", sourceId),
  profileId,
  source: "train2go",
  sourceId,
  date: "2026-04-13",
  sport: "cycling",
  title: "Test",
  status: "pending",
  fetchedAt: NOW,
});

const makeDeps = (
  overrides: Partial<DeleteProfileWithCascadeDeps> = {}
): DeleteProfileWithCascadeDeps => ({
  coaching: overrides.coaching ?? createInMemoryCoachingRepository(),
  coachingSyncState:
    overrides.coachingSyncState ?? createInMemoryCoachingSyncStateRepository(),
  sessionMatch:
    overrides.sessionMatch ?? createInMemorySessionMatchRepository(),
  autoMatchDismissal:
    overrides.autoMatchDismissal ??
    createInMemoryAutoMatchDismissalRepository(),
  userPreferences:
    overrides.userPreferences ?? createInMemoryUserPreferencesRepository(),
});

describe("deleteProfileWithCascade", () => {
  it("removes only the targeted profile's coaching activities", async () => {
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coaching.upsertMany([
      makeRecord("p1", "1"),
      makeRecord("p1", "2"),
      makeRecord("p2", "3"),
    ]);

    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p1"
    );

    expect(
      await coaching.getByProfileAndDateRange("p1", "2026-01-01", "2026-12-31")
    ).toHaveLength(0);
    expect(
      await coaching.getByProfileAndDateRange("p2", "2026-01-01", "2026-12-31")
    ).toHaveLength(1);
  });

  it("removes only the targeted profile's coachingSyncState rows", async () => {
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coachingSyncState.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: NOW,
    });
    await coachingSyncState.put({
      source: "train2go",
      profileId: "p2",
      lastSyncedAt: NOW,
    });

    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p1"
    );

    expect(
      await coachingSyncState.getBySourceAndProfile("train2go", "p1")
    ).toBeUndefined();
    expect(
      await coachingSyncState.getBySourceAndProfile("train2go", "p2")
    ).toBeDefined();
  });

  it("does NOT cascade to converted WorkoutRecord rows (workouts survive)", async () => {
    // deleteProfileWithCascade has no access to WorkoutRepository by design —
    // workouts are profile-agnostic. This test documents the invariant.
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    const workouts = createInMemoryWorkoutRepository();

    await workouts.put(makeWorkout("w1"));
    await coaching.upsertMany([makeRecord("p1", "1")]);

    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p1"
    );

    // Coaching activities deleted; workout is untouched
    expect(
      await coaching.getByProfileAndDateRange("p1", "2026-01-01", "2026-12-31")
    ).toHaveLength(0);
    expect(await workouts.getById("w1")).toBeDefined();
  });

  it("uses the supplied id (NOT getActiveId)", async () => {
    // No active-id surface to leak; the use case takes only the
    // explicit profileId argument and the two repos. This assertion
    // is structural: there is no other source of profile identity in
    // the function signature.
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coaching.upsertMany([makeRecord("p-explicit", "1")]);

    await deleteProfileWithCascade(
      makeDeps({ coaching, coachingSyncState }),
      "p-explicit"
    );

    expect(
      await coaching.getByProfileAndDateRange(
        "p-explicit",
        "2026-01-01",
        "2026-12-31"
      )
    ).toHaveLength(0);
  });

  it("cascades sessionMatch.deleteByProfile", async () => {
    const deps = makeDeps();
    await deps.sessionMatch.put({
      id: "m1",
      profileId: "p1",
      coachingActivityId: "a1",
      workoutId: "w1",
      date: "2026-04-13",
      createdAt: NOW,
      source: "manual",
    });
    await deps.sessionMatch.put({
      id: "m2",
      profileId: "p2",
      coachingActivityId: "a2",
      workoutId: "w2",
      date: "2026-04-13",
      createdAt: NOW,
      source: "manual",
    });

    await deleteProfileWithCascade(deps, "p1");

    expect(
      await deps.sessionMatch.listByProfileAndWeek(
        "p1",
        "2026-04-13",
        "2026-04-19"
      )
    ).toHaveLength(0);
    expect(
      await deps.sessionMatch.listByProfileAndWeek(
        "p2",
        "2026-04-13",
        "2026-04-19"
      )
    ).toHaveLength(1);
  });

  it("cascades autoMatchDismissal.deleteByProfile", async () => {
    const deps = makeDeps();
    await deps.autoMatchDismissal.put({
      profileId: "p1",
      weekStart: "2026-04-13",
      dismissedPairs: [{ activityId: "a1", workoutId: "w1", dismissedAt: NOW }],
    });
    await deps.autoMatchDismissal.put({
      profileId: "p2",
      weekStart: "2026-04-13",
      dismissedPairs: [{ activityId: "a2", workoutId: "w2", dismissedAt: NOW }],
    });

    await deleteProfileWithCascade(deps, "p1");

    expect(
      await deps.autoMatchDismissal.getByProfileAndWeek("p1", "2026-04-13")
    ).toBeUndefined();
    expect(
      await deps.autoMatchDismissal.getByProfileAndWeek("p2", "2026-04-13")
    ).toBeDefined();
  });

  it("cascades userPreferences.delete", async () => {
    const deps = makeDeps();
    await deps.userPreferences.put({
      profileId: "p1",
      calendarDensity: "compact",
    });
    await deps.userPreferences.put({
      profileId: "p2",
      calendarDensity: "comfortable",
    });

    await deleteProfileWithCascade(deps, "p1");

    expect(await deps.userPreferences.get("p1")).toBeUndefined();
    expect(await deps.userPreferences.get("p2")).toBeDefined();
  });
});
