/**
 * Forward migration to v32 — additive `usageEvents` telemetry log. Seeding a
 * real v31 database with a `usage` row, then opening KaiordDatabase, runs the
 * v32 upgrade: Dexie auto-creates the new store empty and leaves every
 * prior-version row untouched (additive, no data transform).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v32-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 31;
const SCHEMA_HEAD = 32;
const SEED_TOTAL_TOKENS = 800;

const seedV31 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v31);
  await older.open();
  await older.table("usage").add({
    yearMonth: "2026-06",
    inputTokens: 500,
    outputTokens: 300,
    totalTokens: SEED_TOTAL_TOKENS,
    totalCost: 0.0024,
    entries: [],
  });
  older.close();
};

const indexKeyPaths = (db: KaiordDatabase, store: string): string[] =>
  db
    .table(store)
    .schema.indexes.map((i) =>
      Array.isArray(i.keyPath) ? i.keyPath.join("+") : (i.keyPath ?? "")
    );

describe("Dexie usageEvents (v32) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should create the usageEvents store empty", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const count = await db.table("usageEvents").count();
    db.close();

    // Assert
    expect(count).toBe(0);
  });

  it("should preserve prior-version usage rows through the additive upgrade", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const usage = await db.table("usage").get("2026-06");
    db.close();

    // Assert
    expect(usage?.totalTokens).toBe(SEED_TOTAL_TOKENS);
  });

  it("should index usageEvents by the monthly-purpose fold index", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const schema = db.table("usageEvents").schema;
    const indexes = indexKeyPaths(db, "usageEvents");
    db.close();

    // Assert
    expect(schema.primKey.keyPath).toBe("id");
    expect(indexes).toContain("yearMonth+purpose");
  });
});
