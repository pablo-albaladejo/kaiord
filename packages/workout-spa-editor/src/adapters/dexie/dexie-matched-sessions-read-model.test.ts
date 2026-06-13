import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import { db } from "./dexie-database";
import { createDexieMatchedSessionsReadModel } from "./dexie-matched-sessions-read-model";

const readModel = createDexieMatchedSessionsReadModel(db);

const PROFILE = "p1";
const COMPOSITE = "p1:train2go:1";
const DATE = "2026-04-29";

const seedActivity = (): CoachingActivityRecord => ({
  id: COMPOSITE,
  profileId: PROFILE,
  source: "train2go",
  sourceId: "1",
  date: DATE,
  sport: "cycling",
  title: "FTP test",
  duration: "60 min",
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
});

const seedWorkout = (id: string): WorkoutRecord =>
  ({
    id,
    date: DATE,
    sport: "cycling",
    source: "train2go",
    state: "ready",
    raw: { duration: { value: 3600, unit: "s" } },
  }) as unknown as WorkoutRecord;

const seedMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: PROFILE,
  coachingActivityId: COMPOSITE,
  workoutId: "w-1",
  date: DATE,
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "manual",
  executedWorkoutIds: [],
  ...overrides,
});

const clearAll = (): Promise<unknown> =>
  Promise.all([
    db.table("sessionMatches").clear(),
    db.table("coachingActivities").clear(),
    db.table("workouts").clear(),
  ]);

describe("dexie matched-sessions read-model", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  describe("loadJoinSources", () => {
    it("should key present activities and workouts by id and omit missing ids", async () => {
      // Arrange
      await db.table("coachingActivities").put(seedActivity());
      await db.table("workouts").put(seedWorkout("w-1"));

      // Act
      const { activitiesById, workoutsById } = await readModel.loadJoinSources(
        [COMPOSITE, "missing-activity"],
        ["w-1", "missing-workout"]
      );

      // Assert
      expect(activitiesById.get(COMPOSITE)?.id).toBe(COMPOSITE);
      expect(activitiesById.has("missing-activity")).toBe(false);
      expect(workoutsById.get("w-1")?.id).toBe("w-1");
      expect(workoutsById.has("missing-workout")).toBe(false);
    });

    it("should return empty maps for empty id sets", async () => {
      // Arrange

      // Act
      const { activitiesById, workoutsById } = await readModel.loadJoinSources(
        [],
        []
      );

      // Assert
      expect(activitiesById.size).toBe(0);
      expect(workoutsById.size).toBe(0);
    });
  });

  describe("findActivityMatch", () => {
    it("should return the match id and workout for a matched activity", async () => {
      // Arrange
      await db.table("workouts").put(seedWorkout("w-1"));
      await db.table("sessionMatches").put(seedMatch());

      // Act
      const result = await readModel.findActivityMatch(PROFILE, COMPOSITE);

      // Assert
      expect(result).toEqual({ matchId: "m-1", workout: expect.anything() });
      expect(result?.workout.id).toBe("w-1");
    });

    it("should return null when no match exists for the activity", async () => {
      // Arrange

      // Act
      const result = await readModel.findActivityMatch(PROFILE, COMPOSITE);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when the matched workout is a dangling ref", async () => {
      // Arrange
      await db.table("sessionMatches").put(seedMatch({ workoutId: "w-gone" }));

      // Act
      const result = await readModel.findActivityMatch(PROFILE, COMPOSITE);

      // Assert
      expect(result).toBeNull();
    });
  });
});
