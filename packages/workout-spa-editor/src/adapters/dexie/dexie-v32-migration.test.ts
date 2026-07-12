/**
 * Upgrade path from v31 to head. v32 adds the `usageEvents` telemetry store;
 * v33 (usage-accounting cutover) folds every legacy `usage` row into it and
 * drops the `usage` store. Seeding a real v31 database with a `usage` row (one
 * entry) and opening KaiordDatabase runs both: the `usage` store is gone and its
 * entry lands in `usageEvents` as a migrated `chat` event, while the store keeps
 * its `[yearMonth+purpose]` fold index.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v32-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 31;
const SCHEMA_HEAD = 34;
const SEED_ENTRY = {
  date: "2026-06-04",
  inputTokens: 500,
  outputTokens: 300,
  tokens: 800,
  cost: 0.0024,
};

const seedV31 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v31);
  await older.open();
  await older.table("usage").add({
    yearMonth: "2026-06",
    inputTokens: SEED_ENTRY.inputTokens,
    outputTokens: SEED_ENTRY.outputTokens,
    totalTokens: SEED_ENTRY.tokens,
    totalCost: SEED_ENTRY.cost,
    entries: [SEED_ENTRY],
  });
  older.close();
};

const indexKeyPaths = (db: KaiordDatabase, store: string): string[] =>
  db
    .table(store)
    .schema.indexes.map((i) =>
      Array.isArray(i.keyPath) ? i.keyPath.join("+") : (i.keyPath ?? "")
    );

describe("Dexie usageEvents (v32) migration to head", () => {
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

  it("should drop the legacy usage store at head", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const tableNames = db.tables.map((t) => t.name);
    db.close();

    // Assert
    expect(tableNames).not.toContain("usage");
  });

  it("should fold the seeded usage entry into a migrated chat usageEvents row", async () => {
    // Arrange
    await seedV31(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const events = await db.table("usageEvents").toArray();
    db.close();

    // Assert
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      purpose: "chat",
      tokens: SEED_ENTRY.tokens,
      cost: SEED_ENTRY.cost,
    });
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
