/**
 * Forward migration v18 → v19 — additive `tombstones` table for
 * cross-device delete propagation. No data transform: existing rows must
 * stay intact and the new empty table must be queryable.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v19-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_V18 = 18;
// Opening KaiordDatabase always migrates to the latest registered version,
// so a seeded v18 db lands at the current head (v24 connections, v25 chat
// conversations, v26 energy-balance stores), not exactly v19.
const SCHEMA_HEAD = 33;
const STORES_V18 = {
  workouts: "id, profileId, [profileId+date], date",
  meta: "key",
} as const;

const seedV18 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v18 = new Dexie(name);
  v18.version(SCHEMA_V18).stores(STORES_V18);
  await v18.open();
  if (rows.length > 0) await v18.table("workouts").bulkAdd([...rows]);
  v18.close();
};

describe("Dexie v18 → v19 migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump database schema to the current head version", async () => {
    // Arrange
    await seedV18(name, []);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create an empty queryable tombstones table", async () => {
    // Arrange
    await seedV18(name, []);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("tombstones").count();
    db.close();

    // Assert
    expect(count).toBe(0);
  });

  it("should keep existing workout rows intact after the upgrade", async () => {
    // Arrange
    await seedV18(name, [{ id: "w-1", profileId: "p-1", date: "2026-05-20" }]);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const row = await db.table("workouts").get("w-1");
    db.close();

    // Assert
    expect(row).toMatchObject({ id: "w-1", profileId: "p-1" });
  });

  it("should accept a tombstone row keyed by [table+id]", async () => {
    // Arrange
    await seedV18(name, []);
    const db = new KaiordDatabase(name);
    await db.open();

    // Act
    await db
      .table("tombstones")
      .add({ table: "workouts", id: "w-9", deletedAt: "2026-05-20T00:00:00Z" });
    const row = await db.table("tombstones").get(["workouts", "w-9"]);
    db.close();

    // Assert
    expect(row).toMatchObject({ table: "workouts", id: "w-9" });
  });
});
