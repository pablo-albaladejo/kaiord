/**
 * Forward migration to v35 — additive health store (`healthHeartRateSeries`,
 * WHOOP wave 3a). Seeding a real v34 database with rows, then opening
 * KaiordDatabase, runs ONLY the v35 upgrade: Dexie auto-creates the new store
 * empty and leaves every prior-version row untouched (additive, no data
 * transform).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v35-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 34;
const SCHEMA_HEAD = 35;

const seedV34 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v34);
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

describe("Dexie heart-rate-series (v35) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seedV34(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create the healthHeartRateSeries store empty", async () => {
    // Arrange
    await seedV34(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("healthHeartRateSeries").count();
    db.close();

    // Assert
    expect(count).toBe(0);
  });

  it("should preserve prior-version rows through the additive upgrade", async () => {
    // Arrange
    await seedV34(name);

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

  it("should index healthHeartRateSeries with the shared health provenance shape and an id primary key", async () => {
    // Arrange
    await seedV34(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const primKey = db.table("healthHeartRateSeries").schema.primKey.keyPath;
    const indexes = indexKeyPaths(db, "healthHeartRateSeries");
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
  });

  it("should dedup on the natural-key index when re-importing the same day", async () => {
    // Arrange
    await seedV34(name);
    const db = new KaiordDatabase(name);
    await db.open();
    const row = {
      id: "hr-1",
      profileId: "p-1",
      date: "2026-07-10",
      sourceBridgeId: "whoop-bridge",
      externalId: "hr:42:2026-07-10",
    };
    await db.table("healthHeartRateSeries").add(row);

    // Act
    const existing = await db
      .table("healthHeartRateSeries")
      .where("[profileId+sourceBridgeId+externalId]")
      .equals(["p-1", "whoop-bridge", "hr:42:2026-07-10"])
      .first();
    const count = await db.table("healthHeartRateSeries").count();
    db.close();

    // Assert
    expect(existing?.id).toBe("hr-1");
    expect(count).toBe(1);
  });
});
