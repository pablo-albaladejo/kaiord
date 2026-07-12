/**
 * Forward migration to v31 — additive lab-analytics stores (`labReports`,
 * `labValues`). Seeding a real v30 database with rows, then opening
 * KaiordDatabase, runs ONLY the v31 upgrade: Dexie auto-creates the two new
 * stores empty and leaves every prior-version row untouched (additive, no data
 * transform).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v31-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 30;
const SCHEMA_HEAD = 35;

const seedV30 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v30);
  await older.open();
  await older.table("profiles").add({ id: "p-1", name: "Athlete" });
  await older.table("dataTypeSourcePolicy").add({
    profileId: "p-1",
    dataType: "sleep",
    mode: "priority",
    sourceOrder: ["whoop-bridge"],
  });
  older.close();
};

const indexKeyPaths = (db: KaiordDatabase, store: string): string[] =>
  db
    .table(store)
    .schema.indexes.map((i) =>
      Array.isArray(i.keyPath) ? i.keyPath.join("+") : (i.keyPath ?? "")
    );

describe("Dexie lab-analytics (v31) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seedV30(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create both lab stores empty", async () => {
    // Arrange
    await seedV30(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const counts = {
      labReports: await db.table("labReports").count(),
      labValues: await db.table("labValues").count(),
    };
    db.close();

    // Assert
    expect(counts).toEqual({ labReports: 0, labValues: 0 });
  });

  it("should preserve prior-version rows through the additive upgrade", async () => {
    // Arrange
    await seedV30(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const profile = await db.table("profiles").get("p-1");
    const policyCount = await db.table("dataTypeSourcePolicy").count();
    db.close();

    // Assert
    expect(profile?.name).toBe("Athlete");
    expect(policyCount).toBe(1);
  });

  it.each([
    {
      store: "labValues",
      compoundIndexes: ["profileId+parameterKey+date", "profileId+reportId"],
    },
    { store: "labReports", compoundIndexes: ["profileId+date"] },
  ])(
    "should index $store by its compound indexes with an id primary key",
    async ({ store, compoundIndexes }) => {
      // Arrange
      await seedV30(name);

      // Act
      const db = new KaiordDatabase(name);
      await db.open();
      const primKey = db.table(store).schema.primKey.keyPath;
      const indexes = indexKeyPaths(db, store);
      db.close();

      // Assert
      expect(primKey).toBe("id");
      expect(indexes).toEqual(expect.arrayContaining(compoundIndexes));
    }
  );
});
