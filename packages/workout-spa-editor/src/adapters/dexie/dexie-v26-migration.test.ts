/**
 * Forward migration to v26 — additive energy-balance stores
 * (`intakeEntries`, `intakePresets`, `energyTargets`). Opening
 * KaiordDatabase from an older seed runs every forward migration and lands at
 * head; Dexie auto-creates the new stores empty (no data transform).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v26-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_SEED = 19;
const SCHEMA_HEAD = 32;
const STORES_SEED = {
  profiles: "id",
  meta: "key",
  tombstones: "[table+id], table, deletedAt",
} as const;

const seed = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SCHEMA_SEED).stores(STORES_SEED);
  await older.open();
  older.close();
};

const indexKeyPaths = (db: KaiordDatabase, store: string): string[] =>
  db
    .table(store)
    .schema.indexes.map((i) =>
      Array.isArray(i.keyPath) ? i.keyPath.join("+") : (i.keyPath ?? "")
    );

describe("Dexie energy-balance (v26) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create the three energy-balance stores empty", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const counts = {
      intakeEntries: await db.table("intakeEntries").count(),
      intakePresets: await db.table("intakePresets").count(),
      energyTargets: await db.table("energyTargets").count(),
    };
    db.close();

    // Assert
    expect(counts).toEqual({
      intakeEntries: 0,
      intakePresets: 0,
      energyTargets: 0,
    });
  });

  it("should index intakeEntries by id with a [profileId+date] index", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const schema = db.table("intakeEntries").schema;
    const indexes = indexKeyPaths(db, "intakeEntries");
    db.close();

    // Assert
    expect(schema.primKey.keyPath).toBe("id");
    expect(indexes).toContain("profileId+date");
  });

  it("should index intakePresets by id with a profileId index", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const schema = db.table("intakePresets").schema;
    const indexes = indexKeyPaths(db, "intakePresets");
    db.close();

    // Assert
    expect(schema.primKey.keyPath).toBe("id");
    expect(indexes).toContain("profileId");
  });

  it("should key energyTargets on profileId (one goal per profile)", async () => {
    // Arrange
    await seed(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const schema = db.table("energyTargets").schema;
    db.close();

    // Assert
    expect(schema.primKey.keyPath).toBe("profileId");
  });

  it("should persist an intake entry retrievable by the [profileId+date] index", async () => {
    // Arrange
    await seed(name);
    const db = new KaiordDatabase(name);
    await db.open();
    await db.table("intakeEntries").add({
      id: "i-1",
      profileId: "p-1",
      date: "2026-06-21",
      loggedAt: "2026-06-21T08:00:00.000Z",
      kcal: 600,
      proteinG: 40,
      carbG: 60,
      fatG: 20,
    });

    // Act
    const rows = await db
      .table("intakeEntries")
      .where("[profileId+date]")
      .equals(["p-1", "2026-06-21"])
      .toArray();
    db.close();

    // Assert
    expect(rows).toHaveLength(1);
  });
});
