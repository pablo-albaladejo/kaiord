/**
 * Transitional dual-write (F0 step 0.5). An imported file classified as an
 * executed activity lands as BOTH a first-class `activity` row (fit-import
 * provenance + content-hash externalId, deduped) and — transitionally — a
 * WorkoutRecord so the calendar keeps rendering it. A structured workout with
 * no executed data writes only the WorkoutRecord.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import type { KRD } from "../../../types/krd";
import { persistImportedWorkout } from "./persist-imported-workout";

const PROFILE = "00000000-0000-4000-8000-0000000000a1";
const DATE = "2026-04-29";

const activityKrd = (): KRD =>
  ({
    version: "2.0",
    type: "recorded_activity",
    metadata: { created: "2026-04-29T06:30:00.000Z", sport: "cycling" },
    sessions: [
      {
        startTime: "2026-04-29T06:30:00.000Z",
        totalElapsedTime: 3600,
        sport: "cycling",
      },
    ],
    records: [{ timestamp: "2026-04-29T06:30:01.000Z" }],
  }) as KRD;

const structuredKrd = (): KRD =>
  ({
    version: "2.0",
    type: "structured_workout",
    metadata: { created: "2026-04-29T06:30:00.000Z", sport: "cycling" },
  }) as KRD;

describe("persistImportedWorkout dual-write", () => {
  let db: KaiordDatabase;
  let name: string;

  beforeEach(async () => {
    name = `kaiord-persist-${Date.now()}-${Math.random()}`;
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should write an activity row with provenance plus a WorkoutRecord for an execution", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await persistImportedWorkout(persistence, {
      krd: activityKrd(),
      date: DATE,
      profileId: PROFILE,
      sport: "cycling",
    });
    const activities = await db.table("activities").toArray();
    const workouts = await db.table("workouts").toArray();

    // Assert
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      profileId: PROFILE,
      date: DATE,
      sourceBridgeId: "fit-import",
    });
    expect(activities[0].externalId).toEqual(expect.any(String));
    expect(workouts).toHaveLength(1);
    // The activity links to its transitional twin WorkoutRecord.
    expect(activities[0].linkedWorkoutId).toBe(workouts[0].id);
  });

  it("should not duplicate the activity when the same file is re-imported", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await persistImportedWorkout(persistence, {
      krd: activityKrd(),
      date: DATE,
      profileId: PROFILE,
      sport: "cycling",
    });
    await persistImportedWorkout(persistence, {
      krd: activityKrd(),
      date: DATE,
      profileId: PROFILE,
      sport: "cycling",
    });
    const activities = await db.table("activities").toArray();

    // Assert
    expect(activities).toHaveLength(1);
  });

  it("should write only a WorkoutRecord for a structured workout with no executed data", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await persistImportedWorkout(persistence, {
      krd: structuredKrd(),
      date: DATE,
      profileId: PROFILE,
      sport: "cycling",
    });
    const activities = await db.table("activities").toArray();
    const workouts = await db.table("workouts").toArray();

    // Assert
    expect(activities).toHaveLength(0);
    expect(workouts).toHaveLength(1);
  });
});
