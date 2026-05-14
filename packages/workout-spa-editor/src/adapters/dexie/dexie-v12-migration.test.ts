/**
 * Forward migration v11 → v12 — `SessionMatch.executedWorkoutIds`
 * backfill. Ensures every existing row gains an empty array, and the
 * upgrade is idempotent on re-run.
 */
import "fake-indexeddb/auto";

import type { Transaction } from "dexie";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { toPersistedCoachingActivityId } from "../../types/coaching-activity-record";
import { applyV12Upgrade } from "./dexie-v12-migration";

const dbName = (suffix: string) =>
  `kaiord-test-v12-${suffix}-${Date.now()}-${Math.random()}`;

const NOW = "2026-05-08T10:00:00.000Z";
const SCHEMA_V11 = 11;
const SCHEMA_V12 = 12;
const FIXTURE_PROFILE_ID = "p1";
const FIXTURE_ACTIVITY_ID = toPersistedCoachingActivityId(
  FIXTURE_PROFILE_ID,
  "train2go:12345"
);

const stores = {
  sessionMatches:
    "id, [profileId+coachingActivityId], [profileId+workoutId], [profileId+date], coachingActivityId, workoutId, profileId",
} as const;

const seedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "M1",
  profileId: FIXTURE_PROFILE_ID,
  coachingActivityId: FIXTURE_ACTIVITY_ID,
  workoutId: "w-1",
  date: "2026-04-29",
  createdAt: NOW,
  source: "auto-coaching",
  ...overrides,
});

const seedV11 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v11 = new Dexie(name);
  v11.version(SCHEMA_V11).stores(stores);
  await v11.open();
  if (rows.length > 0) {
    await v11.table("sessionMatches").bulkAdd([...rows]);
  }
  v11.close();
};

const openWithV12Migration = async (name: string): Promise<Dexie> => {
  const db = new Dexie(name);
  db.version(SCHEMA_V12).stores(stores).upgrade(applyV12Upgrade);
  await db.open();
  return db;
};

type Row = { id: string; executedWorkoutIds?: string[] };

describe("Dexie v11 → v12 migration (executedWorkoutIds backfill)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should backfill executedWorkoutIds: [] on every legacy row missing the field", async () => {
    // Arrange
    await seedV11(name, [
      seedRow({ id: "M1" }),
      seedRow({ id: "M2", workoutId: "w-2" }),
    ]);

    // Act
    const db = await openWithV12Migration(name);

    // Assert
    const rows = (await db.table("sessionMatches").toArray()) as Row[];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.executedWorkoutIds).toEqual([]);
    }
    db.close();
  });

  it("should preserve an existing executedWorkoutIds array verbatim", async () => {
    // Arrange
    await seedV11(name, [
      seedRow({ id: "M1", executedWorkoutIds: ["w-exec-1", "w-exec-2"] }),
    ]);

    // Act
    const db = await openWithV12Migration(name);

    // Assert
    const rows = (await db.table("sessionMatches").toArray()) as Row[];
    expect(rows[0]?.executedWorkoutIds).toEqual(["w-exec-1", "w-exec-2"]);
    db.close();
  });

  it("should be idempotent on a re-run", async () => {
    // Arrange
    await seedV11(name, [seedRow({ id: "M1" })]);
    const first = await openWithV12Migration(name);
    first.close();

    // Act
    const second = new Dexie(name);
    second.version(SCHEMA_V12).stores(stores);
    await second.open();
    await second.transaction("rw", ["sessionMatches"], async (tx) =>
      applyV12Upgrade(tx as unknown as Transaction)
    );

    // Assert
    const rows = (await second.table("sessionMatches").toArray()) as Row[];
    expect(rows[0]?.executedWorkoutIds).toEqual([]);
    second.close();
  });

  it("should be a no-op on a clean database with no rows", async () => {
    // Arrange
    await seedV11(name, []);

    // Act
    const db = await openWithV12Migration(name);

    // Assert
    expect(await db.table("sessionMatches").toArray()).toHaveLength(0);
    db.close();
  });
});
