/**
 * Forward migration v9 → v10 — coaching auto-match retro-fix.
 *
 * Scans `coachingActivities` × `workouts`, writes the missing
 * `sessionMatches` rows with `source="auto-coaching-v10-migration"`
 * (per spa-coaching-integration). Idempotent: a re-run produces zero
 * new writes.
 */
import "fake-indexeddb/auto";

import Dexie, { type Transaction } from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyV10Upgrade, consumeLastV10Result } from "./dexie-v10-migration";

const dbName = (suffix: string) =>
  `kaiord-test-v10-${suffix}-${Date.now()}-${Math.random()}`;

const NOW = "2026-05-04T10:00:00.000Z";
const SCHEMA_V9 = 9;
const SCHEMA_V10 = 10;

const seedActivity = (overrides: Record<string, unknown> = {}) => ({
  id: "p1:train2go:12345",
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-29",
  sport: "cycling",
  title: "FTP test",
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
  ...overrides,
});

const seedWorkout = (overrides: Record<string, unknown> = {}) => ({
  id: "w1",
  date: "2026-04-29",
  sport: "cycling",
  source: "train2go",
  sourceId: "p1:12345",
  state: "raw",
  ...overrides,
});

const v10Stores = {
  coachingActivities:
    "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
  workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
  sessionMatches:
    "id, [profileId+coachingActivityId], [profileId+workoutId], [profileId+date], coachingActivityId, workoutId, profileId",
} as const;

const openWithMigration = async (
  name: string,
  ids: string[]
): Promise<Dexie> => {
  let counter = 0;
  const db = new Dexie(name);
  db.version(SCHEMA_V10)
    .stores(v10Stores)
    .upgrade((tx) =>
      applyV10Upgrade(tx, {
        newId: () => ids[counter++] ?? `auto-${counter}`,
        now: () => NOW,
      })
    );
  await db.open();
  return db;
};

const seedV9 = async (
  name: string,
  options: {
    activities?: ReadonlyArray<Record<string, unknown>>;
    workouts?: ReadonlyArray<Record<string, unknown>>;
    matches?: ReadonlyArray<Record<string, unknown>>;
  } = {}
): Promise<void> => {
  const v9 = new Dexie(name);
  v9.version(SCHEMA_V9).stores(v10Stores);
  await v9.open();
  if (options.activities)
    await v9.table("coachingActivities").bulkAdd([...options.activities]);
  if (options.workouts)
    await v9.table("workouts").bulkAdd([...options.workouts]);
  if (options.matches)
    await v9.table("sessionMatches").bulkAdd([...options.matches]);
  v9.close();
};

describe("Dexie v9 → v10 migration (coaching auto-match retro-fix)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
    consumeLastV10Result();
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should create a SessionMatch for each converted-without-match pair", async () => {
    // Arrange
    await seedV9(name, {
      activities: [seedActivity()],
      workouts: [seedWorkout()],
    });

    // Act
    const db = await openWithMigration(name, ["M-1"]);

    // Assert
    const matches = await db.table("sessionMatches").toArray();
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      coachingActivityId: "p1:train2go:12345",
      workoutId: "w1",
      source: "auto-coaching-v10-migration",
    });
    expect(consumeLastV10Result()).toEqual({ created: 1 });
    db.close();
  });

  it("should skip pairs that already have a SessionMatch", async () => {
    // Arrange
    await seedV9(name, {
      activities: [seedActivity()],
      workouts: [seedWorkout()],
      matches: [
        {
          id: "M-existing",
          profileId: "p1",
          coachingActivityId: "p1:train2go:12345",
          workoutId: "w1",
          date: "2026-04-29",
          createdAt: NOW,
          source: "manual",
        },
      ],
    });

    // Act
    const db = await openWithMigration(name, ["M-shouldnt-fire"]);

    // Assert
    const matches = await db.table("sessionMatches").toArray();
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("M-existing");
    expect(consumeLastV10Result()).toEqual({ created: 0 });
    db.close();
  });

  it("should be a no-op on a clean database with no activities", async () => {
    // Arrange
    await seedV9(name);

    // Act
    const db = await openWithMigration(name, []);

    // Assert
    expect(await db.table("sessionMatches").toArray()).toHaveLength(0);
    expect(consumeLastV10Result()).toEqual({ created: 0 });
    db.close();
  });

  it("should preserve cross-profile separation by joining on namespaced sourceId", async () => {
    // Arrange
    // Same source platform id 12345 but two profiles; only A converted.
    await seedV9(name, {
      activities: [
        seedActivity({ id: "pA:train2go:12345", profileId: "pA" }),
        seedActivity({ id: "pB:train2go:12345", profileId: "pB" }),
      ],
      workouts: [seedWorkout({ sourceId: "pA:12345" })],
    });

    // Act
    const db = await openWithMigration(name, ["M-A"]);

    // Assert
    const matches = await db.table("sessionMatches").toArray();
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("pA");
    db.close();
  });

  it("should be idempotent when the migration is re-applied to an already-matched DB", async () => {
    // Arrange
    await seedV9(name, {
      activities: [seedActivity()],
      workouts: [seedWorkout()],
    });
    const first = await openWithMigration(name, ["M-1"]);
    first.close();
    // Re-running the upgrade callback against the same DB writes nothing
    // (Dexie's version flag has advanced; we model the re-run by invoking
    // the migration directly inside a fresh transaction.)
    consumeLastV10Result();
    const second = new Dexie(name);
    second.version(SCHEMA_V10).stores(v10Stores);
    await second.open();

    // Act
    await second.transaction(
      "rw",
      ["coachingActivities", "workouts", "sessionMatches"],
      async (tx) =>
        applyV10Upgrade(tx as unknown as Transaction, {
          newId: () => "M-shouldnt-fire",
          now: () => NOW,
        })
    );

    // Assert
    const matches = await second.table("sessionMatches").toArray();
    expect(matches).toHaveLength(1);
    expect(consumeLastV10Result()).toEqual({ created: 0 });
    second.close();
  });
});
