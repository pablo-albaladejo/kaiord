/**
 * deleteProfileWithCascade — application use case tests.
 */

import { describe, expect, it } from "vitest";

import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "../../test-utils/in-memory-coaching-sync-state-repository";
import { createInMemoryWorkoutRepository } from "../../test-utils/in-memory-workout-repository";
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

describe("deleteProfileWithCascade", () => {
  it("removes only the targeted profile's coaching activities", async () => {
    const coaching = createInMemoryCoachingRepository();
    const coachingSyncState = createInMemoryCoachingSyncStateRepository();
    await coaching.upsertMany([
      makeRecord("p1", "1"),
      makeRecord("p1", "2"),
      makeRecord("p2", "3"),
    ]);

    await deleteProfileWithCascade({ coaching, coachingSyncState }, "p1");

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

    await deleteProfileWithCascade({ coaching, coachingSyncState }, "p1");

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

    await deleteProfileWithCascade({ coaching, coachingSyncState }, "p1");

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
      { coaching, coachingSyncState },
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
});
