import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withTombstones } from "../adapters/with-tombstones";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Snapshot } from "../types/snapshot";
import { restoreDeletedWorkout } from "./restore-deleted-workout";
import { mergeSnapshots } from "./sync/merge-snapshots";
import { makeWorkoutRecord } from "./test-helpers";

const CREATED = "2026-10-01T08:00:00.000Z";
const DELETED_AT = new Date("2026-10-05T10:00:00.000Z");
const ID = "550e8400-e29b-41d4-a716-446655440055";

const manifest = (exportedAt: string) => ({
  schemaVersion: 19,
  deviceId: "dev",
  exportedAt,
  encrypted: false,
});

beforeEach(() => {
  // The delete and the undo land in the same millisecond: the undo must
  // still be newer than the tombstone.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DELETED_AT);
});
afterEach(() => vi.useRealTimers());

const deleteThenRestore = async () => {
  const persistence = withTombstones(createInMemoryPersistence());
  const record = makeWorkoutRecord({ id: ID, updatedAt: CREATED });
  await persistence.workouts.put(record);
  await persistence.workouts.delete(ID);
  await restoreDeletedWorkout(persistence, record);
  return persistence;
};

describe("restoreDeletedWorkout", () => {
  it("should stamp the row newer than its tombstone", async () => {
    // Arrange
    const persistence = await deleteThenRestore();

    // Act
    const row = await persistence.workouts.getById(ID);
    const tombstone = await persistence.tombstones.get("workouts", ID);

    // Assert
    expect(tombstone?.deletedAt).toBe(DELETED_AT.toISOString());
    expect(Date.parse(row!.updatedAt)).toBeGreaterThan(
      Date.parse(tombstone!.deletedAt)
    );
  });

  it("should survive a merge with its own tombstone and a stale remote copy", async () => {
    // Arrange
    const persistence = await deleteThenRestore();
    const row = (await persistence.workouts.getById(ID)) as WorkoutRecord;
    const tombstones = await persistence.tombstones.list();
    const local: Snapshot = {
      manifest: manifest(DELETED_AT.toISOString()),
      tables: { workouts: [row] },
      tombstones,
    };
    const remote: Snapshot = {
      manifest: manifest(CREATED),
      tables: { workouts: [makeWorkoutRecord({ id: ID, updatedAt: CREATED })] },
      tombstones,
    };

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(merged.tables.workouts).toEqual([row]);
  });

  it("should not overwrite a workout that exists again", async () => {
    // Arrange
    const persistence = withTombstones(createInMemoryPersistence());
    const current = makeWorkoutRecord({ id: ID, date: "2026-10-09" });
    await persistence.workouts.put(current);

    // Act
    await restoreDeletedWorkout(
      persistence,
      makeWorkoutRecord({ id: ID, date: "2026-10-01" })
    );

    // Assert
    expect(await persistence.workouts.getById(ID)).toEqual(current);
  });
});
