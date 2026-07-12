/**
 * Forward migration to v34 — additive health stores (`healthStrain`,
 * `healthVitals`, WHOOP wave 2). Seeding a real v33 database with rows, then
 * opening KaiordDatabase, runs ONLY the v34 upgrade: Dexie auto-creates the
 * two new stores empty and leaves every prior-version row untouched
 * (additive, no data transform).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v34-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 33;
const SCHEMA_HEAD = 35;

const seedV33 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v33);
  await older.open();
  await older.table("profiles").add({ id: "p-1", name: "Athlete" });
  await older.table("healthHrv").add({
    id: "h-1",
    profileId: "p-1",
    date: "2026-07-10",
  });
  older.close();
};

const indexKeyPaths = (db: KaiordDatabase, store: string): string[] =>
  db
    .table(store)
    .schema.indexes.map((i) =>
      Array.isArray(i.keyPath) ? i.keyPath.join("+") : (i.keyPath ?? "")
    );

describe("Dexie health-strain-vitals (v34) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seedV33(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create both health stores empty", async () => {
    // Arrange
    await seedV33(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const counts = {
      healthStrain: await db.table("healthStrain").count(),
      healthVitals: await db.table("healthVitals").count(),
    };
    db.close();

    // Assert
    expect(counts).toEqual({ healthStrain: 0, healthVitals: 0 });
  });

  it("should preserve prior-version rows through the additive upgrade", async () => {
    // Arrange
    await seedV33(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const profile = await db.table("profiles").get("p-1");
    const hrvCount = await db.table("healthHrv").count();
    db.close();

    // Assert
    expect(profile?.name).toBe("Athlete");
    expect(hrvCount).toBe(1);
  });

  it.each([{ store: "healthStrain" }, { store: "healthVitals" }])(
    "should index $store with the shared health provenance shape and an id primary key",
    async ({ store }) => {
      // Arrange
      await seedV33(name);

      // Act
      const db = new KaiordDatabase(name);
      await db.open();
      const primKey = db.table(store).schema.primKey.keyPath;
      const indexes = indexKeyPaths(db, store);
      db.close();

      // Assert
      expect(primKey).toBe("id");
      expect(indexes).toEqual(
        expect.arrayContaining([
          "profileId",
          "profileId+date",
          "date",
          "sourceBridgeId",
          "externalId",
          "profileId+sourceBridgeId+externalId",
        ])
      );
    }
  );
});
