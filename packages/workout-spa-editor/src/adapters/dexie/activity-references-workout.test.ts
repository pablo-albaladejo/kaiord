/**
 * Whether a workout is a recording (design §3.3): an activity of the
 * profile either is that workout by `id` or links to it by `linkedWorkoutId`.
 * A match can pair a plan with such a workout while its executed slot stays
 * empty, so `moveSession` asks the activities, not the match.
 */
import { beforeEach, describe, expect, it } from "vitest";

import type { ActivityRepository } from "../../ports/activity-repository";
import { createInMemoryActivityRepository } from "../../test-utils/in-memory-activity-repository";
import type { ActivityRecord } from "../../types/activity-record";
import { createDexieActivityRepository } from "./dexie-activity-repository";
import { db } from "./dexie-database";

const activity = (overrides: Partial<ActivityRecord>): ActivityRecord => ({
  id: "act-1",
  profileId: "p1",
  date: "2026-10-06",
  sport: "cycling",
  sourceBridgeId: "garmin",
  externalId: "ext-1",
  linkedWorkoutId: null,
  krd: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  ...overrides,
});

describe.each([
  ["dexie", () => createDexieActivityRepository(db)],
  ["in-memory", () => createInMemoryActivityRepository()],
])("referencesWorkout (%s)", (_name, make) => {
  let repo: ActivityRepository;

  beforeEach(async () => {
    await db.table("activities").clear();
    repo = make();
  });

  it("should find a workout an activity links to", async () => {
    // Arrange
    await repo.upsertByExternalId(activity({ linkedWorkoutId: "w-rec" }));

    // Act
    const found = await repo.referencesWorkout("p1", "w-rec");

    // Assert
    expect(found).toBe(true);
  });

  it("should find a workout that is itself an activity", async () => {
    // Arrange
    await repo.upsertByExternalId(activity({ id: "w-rec" }));

    // Act
    const found = await repo.referencesWorkout("p1", "w-rec");

    // Assert
    expect(found).toBe(true);
  });

  it("should not find a planned workout or another profile's recording", async () => {
    // Arrange
    await repo.upsertByExternalId(
      activity({ profileId: "p2", id: "w-rec", linkedWorkoutId: "w-rec" })
    );

    // Act
    const found = [
      await repo.referencesWorkout("p1", "w-plan"),
      await repo.referencesWorkout("p1", "w-rec"),
    ];

    // Assert
    expect(found).toEqual([false, false]);
  });
});
