/**
 * Integration tests for the one-time guarded junk cleanup.
 *
 * Verifies:
 *  - removes an untouched coaching template + its session match on first run
 *  - second run is a no-op (meta flag prevents re-execution)
 *  - non-junk workouts survive
 *  - errors do not propagate (never blocks app start)
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { runJunkCleanupOnce } from "./dexie-junk-cleanup";

const dbName = (suffix: string) =>
  `kaiord-test-junk-cleanup-${suffix}-${Date.now()}-${Math.random()}`;

const NOW = "2026-01-01T10:00:00.000Z";

const WARMUP_STEP = {
  stepIndex: 0,
  name: "Warmup",
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "heart_rate",
  target: { type: "heart_rate", value: { unit: "zone", value: 1 } },
  intensity: "warmup",
};

const makeTemplateWorkout = (id = "w-junk") => ({
  id,
  profileId: "p-1",
  date: "2026-01-01",
  sport: "cycling",
  source: "train2go",
  sourceId: "ns:42",
  planId: null,
  state: "structured",
  raw: null,
  krd: {
    type: "structured_workout",
    sport: "cycling",
    extensions: {
      structured_workout: {
        name: "My Ride",
        sport: "cycling",
        steps: [WARMUP_STEP],
      },
    },
  },
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

const makeSessionMatch = (workoutId: string, id = "sm-1") => ({
  id,
  profileId: "p-1",
  coachingActivityId: "ca-1",
  workoutId,
  date: "2026-01-01",
  source: "manual-coaching",
  createdAt: NOW,
  updatedAt: NOW,
});

describe("runJunkCleanupOnce", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(() => {
    name = dbName("apply");
    db = new KaiordDatabase(name);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should remove an untouched coaching template and its session match on first run", async () => {
    // Arrange
    await db.open();
    await db.table("workouts").add(makeTemplateWorkout("w-junk"));
    await db.table("sessionMatches").add(makeSessionMatch("w-junk"));

    // Act
    await runJunkCleanupOnce(db);

    // Assert
    const workout = await db.table("workouts").get("w-junk");
    const match = await db.table("sessionMatches").get("sm-1");
    expect(workout).toBeUndefined();
    expect(match).toBeUndefined();
  });

  it("should set the meta flag after running so a second run is a no-op", async () => {
    // Arrange
    await db.open();
    await db.table("workouts").add(makeTemplateWorkout("w-junk"));

    // Act
    await runJunkCleanupOnce(db);
    await db.table("workouts").add(makeTemplateWorkout("w-junk2"));
    await runJunkCleanupOnce(db);

    // Assert
    const second = await db.table("workouts").get("w-junk2");
    expect(second).toBeDefined();
  });

  it("should not remove a user-edited coaching workout (updatedAt > createdAt)", async () => {
    // Arrange
    await db.open();
    const edited = {
      ...makeTemplateWorkout("w-edited"),
      updatedAt: "2026-01-02T10:00:00.000Z",
    };
    await db.table("workouts").add(edited);

    // Act
    await runJunkCleanupOnce(db);

    // Assert
    const workout = await db.table("workouts").get("w-edited");
    expect(workout).toBeDefined();
  });

  it("should not throw when an error occurs inside the cleanup", async () => {
    // Arrange
    await db.open();
    // Force a failure by making meta table throw
    const origGet = db.table("meta").get.bind(db.table("meta"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.table("meta") as any).get = async () => {
      throw new Error("simulated failure");
    };

    // Act
    let threw = false;
    try {
      await runJunkCleanupOnce(db);
    } catch {
      threw = true;
    }

    // Assert
    expect(threw).toBe(false);
    // restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.table("meta") as any).get = origGet;
  });
});
