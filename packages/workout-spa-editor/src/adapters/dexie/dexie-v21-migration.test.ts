/**
 * Forward migration to v21 — additive `chatMessages` table for the AI chat
 * transcript (on top of v20's coachingDayNotes). Opening KaiordDatabase from
 * an older seed runs every forward migration and lands at head; no data
 * transform — existing rows stay intact and the new table is queryable.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v21-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 19;
const SCHEMA_HEAD = 30;
const STORES_SEED = {
  workouts: "id, profileId, [profileId+date], date",
  tombstones: "[table+id], table, deletedAt",
  meta: "key",
} as const;

const seed = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  if (rows.length > 0) await older.table("workouts").bulkAdd([...rows]);
  older.close();
};

describe("Dexie chatMessages (v21) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seed(name, []);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create an empty queryable chatMessages table", async () => {
    // Arrange
    await seed(name, []);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("chatMessages").count();
    db.close();

    // Assert
    expect(count).toBe(0);
  });

  it("should keep existing workout rows intact after the upgrade", async () => {
    // Arrange
    await seed(name, [{ id: "w-1", profileId: "p-1", date: "2026-06-13" }]);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const row = await db.table("workouts").get("w-1");
    db.close();

    // Assert
    expect(row).toMatchObject({ id: "w-1", profileId: "p-1" });
  });

  it("should serve the per-profile chronological index", async () => {
    // Arrange
    await seed(name, []);
    const db = new KaiordDatabase(name);
    await db.open();

    // Act
    await db.table("chatMessages").bulkAdd([
      {
        id: "m2",
        profileId: "p-1",
        role: "user",
        content: "b",
        createdAt: "2026-06-13T10:02:00.000Z",
      },
      {
        id: "m1",
        profileId: "p-1",
        role: "user",
        content: "a",
        createdAt: "2026-06-13T10:01:00.000Z",
      },
    ]);
    const ordered = await db
      .table("chatMessages")
      .where("[profileId+createdAt]")
      .between(["p-1", ""], ["p-1", "￿"], true, true)
      .toArray();
    db.close();

    // Assert
    expect(ordered.map((m: { id: string }) => m.id)).toEqual(["m1", "m2"]);
  });
});
