/**
 * Forward migration v12 → v13 — workouts gain `profileId`.
 *
 * Backfills every legacy row from `meta.activeProfileId`. Throws when
 * workouts exist but no active profile is set. Idempotent on re-run.
 * Empty workouts table is a no-op.
 */
import "fake-indexeddb/auto";

import type { Transaction } from "dexie";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyV13Upgrade } from "./dexie-v13-migration";

const dbName = (suffix: string) =>
  `kaiord-test-v13-${suffix}-${Date.now()}-${Math.random()}`;

const NOW = "2026-05-08T10:00:00.000Z";
const SCHEMA_V12 = 12;
const SCHEMA_V13 = 13;
const ACTIVE_PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const STORES_V12 = {
  workouts: "id, date, [date+state], [source+sourceId], sport, *tags",
  meta: "key",
} as const;

const STORES_V13 = {
  workouts:
    "id, profileId, [profileId+date], date, [date+state], [source+sourceId], sport, *tags",
  meta: "key",
} as const;

const seedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "w-1",
  date: "2026-04-13",
  sport: "cycling",
  source: "kaiord",
  sourceId: null,
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
  ...overrides,
});

const seedV12 = async (
  name: string,
  workouts: ReadonlyArray<Record<string, unknown>>,
  meta: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v12 = new Dexie(name);
  v12.version(SCHEMA_V12).stores(STORES_V12);
  await v12.open();
  if (workouts.length > 0) await v12.table("workouts").bulkAdd([...workouts]);
  if (meta.length > 0) await v12.table("meta").bulkAdd([...meta]);
  v12.close();
};

const openWithV13Migration = async (name: string): Promise<Dexie> => {
  const db = new Dexie(name);
  db.version(SCHEMA_V13).stores(STORES_V13).upgrade(applyV13Upgrade);
  await db.open();
  return db;
};

type Row = { id: string; profileId?: string };

describe("Dexie v12 → v13 migration (workouts profileId backfill)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should backfill profileId from meta.activeProfileId on every legacy row", async () => {
    // Arrange
    await seedV12(
      name,
      [seedRow({ id: "w-1" }), seedRow({ id: "w-2", date: "2026-04-14" })],
      [{ key: "activeProfileId", value: ACTIVE_PROFILE_ID }]
    );

    // Act
    const db = await openWithV13Migration(name);

    // Assert
    const rows = (await db.table("workouts").toArray()) as Row[];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.profileId).toBe(ACTIVE_PROFILE_ID);
    }
    db.close();
  });

  it("should preserve an existing profileId verbatim", async () => {
    // Arrange
    const otherProfileId = "22222222-2222-4222-8222-222222222222";
    await seedV12(
      name,
      [seedRow({ id: "w-1", profileId: otherProfileId })],
      [{ key: "activeProfileId", value: ACTIVE_PROFILE_ID }]
    );

    // Act
    const db = await openWithV13Migration(name);

    // Assert
    const rows = (await db.table("workouts").toArray()) as Row[];
    expect(rows[0]?.profileId).toBe(otherProfileId);
    db.close();
  });

  it("should be idempotent on a re-run", async () => {
    // Arrange
    await seedV12(
      name,
      [seedRow({ id: "w-1" })],
      [{ key: "activeProfileId", value: ACTIVE_PROFILE_ID }]
    );
    const first = await openWithV13Migration(name);
    first.close();

    // Act
    const second = new Dexie(name);
    second.version(SCHEMA_V13).stores(STORES_V13);
    await second.open();
    await second.transaction("rw", ["workouts", "meta"], async (tx) =>
      applyV13Upgrade(tx as unknown as Transaction)
    );

    // Assert
    const rows = (await second.table("workouts").toArray()) as Row[];
    expect(rows[0]?.profileId).toBe(ACTIVE_PROFILE_ID);
    second.close();
  });

  it("should be a no-op on an empty workouts table even without an active profile", async () => {
    // Arrange
    await seedV12(name, [], []);

    // Act
    const db = await openWithV13Migration(name);

    // Assert
    expect(await db.table("workouts").toArray()).toHaveLength(0);
    db.close();
  });

  it("should throw a descriptive error when workouts exist but meta.activeProfileId is missing", async () => {
    // Arrange
    await seedV12(name, [seedRow({ id: "w-1" })], []);

    // Act
    const open = openWithV13Migration(name);

    // Assert
    await expect(open).rejects.toThrow(/activeProfileId is missing/i);
  });
});
