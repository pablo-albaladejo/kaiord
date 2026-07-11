/**
 * v33 usage-accounting cutover migration. Seeds a real v32 database with a
 * `usage` row (2 entries) plus a pre-existing `usageEvents` row, opens
 * KaiordDatabase at head, and verifies: the `usage` store is dropped, each
 * entry becomes a `chat` usage event carrying its cost, prior `usageEvents`
 * survive, and a re-open (already at head) neither errors nor double-migrates.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = (suffix: string) =>
  `kaiord-test-v33-${suffix}-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 32;
const SCHEMA_HEAD = 33;
const MIGRATED_COUNT = 2;
const AGG_INPUT_TOKENS = 700;
const AGG_COST = 0.0021;

const ENTRY_ONE = {
  date: "2026-05-03",
  inputTokens: 100,
  outputTokens: 40,
  tokens: 140,
  cost: 0.0007,
};
const ENTRY_TWO = {
  date: "2026-05-12",
  inputTokens: 200,
  outputTokens: 60,
  tokens: 260,
  cost: 0.0013,
};

const PRIOR_EVENT = {
  id: "pre-1",
  yearMonth: "2026-06",
  date: "2026-06-01",
  purpose: "workout_generation",
  promptTokens: 500,
  completionTokens: 300,
  tokens: 800,
  cost: 0.004,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const seedV32 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v32);
  await older.open();
  await older.table("usage").add({
    yearMonth: "2026-05",
    inputTokens: 300,
    outputTokens: 100,
    totalTokens: 400,
    totalCost: 0.002,
    entries: [ENTRY_ONE, ENTRY_TWO],
  });
  await older.table("usageEvents").add(PRIOR_EVENT);
  older.close();
};

const migratedEvents = async (db: KaiordDatabase) =>
  (await db.table("usageEvents").toArray()).filter((e) =>
    String(e.id).startsWith("usage-migrated:")
  );

describe("Dexie usage-accounting cutover (v33) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should bump the database schema to the current head version", async () => {
    // Arrange
    await seedV32(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const version = db.verno;
    db.close();

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
  });

  it("should drop the legacy usage store", async () => {
    // Arrange
    await seedV32(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const tableNames = db.tables.map((t) => t.name);
    db.close();

    // Assert
    expect(tableNames).not.toContain("usage");
  });

  it("should migrate each usage entry into a chat event carrying its cost", async () => {
    // Arrange
    await seedV32(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const migrated = await migratedEvents(db);
    db.close();

    // Assert
    expect(migrated).toHaveLength(MIGRATED_COUNT);
    expect(migrated.every((e) => e.purpose === "chat")).toBe(true);
    expect(migrated.every((e) => e.providerType === undefined)).toBe(true);
    expect(migrated.map((e) => e.cost).sort()).toEqual(
      [ENTRY_ONE.cost, ENTRY_TWO.cost].sort()
    );
  });

  it("should not double-count chat when a v32 dual-write mirror already exists", async () => {
    // Arrange
    const older = new Dexie(name);
    older.version(SEED_VERSION).stores(SCHEMAS.v32);
    await older.open();
    await older.table("usage").add({
      yearMonth: "2026-05",
      entries: [ENTRY_ONE, ENTRY_TWO],
    });
    await older.table("usageEvents").add({
      id: "mirror-chat-1",
      yearMonth: "2026-05",
      date: ENTRY_ONE.date,
      purpose: "chat",
      promptTokens: ENTRY_ONE.inputTokens,
      completionTokens: ENTRY_ONE.outputTokens,
      tokens: ENTRY_ONE.tokens,
      cost: ENTRY_ONE.cost,
      createdAt: `${ENTRY_ONE.date}T10:00:00.000Z`,
    });
    await older.table("usageEvents").add(PRIOR_EVENT);
    older.close();

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const all = await db.table("usageEvents").toArray();
    db.close();

    // Assert
    const chat = all.filter((e) => e.purpose === "chat");
    expect(chat).toHaveLength(MIGRATED_COUNT);
    expect(chat.every((e) => String(e.id).startsWith("usage-migrated:"))).toBe(
      true
    );
    expect(all.some((e) => e.id === PRIOR_EVENT.id)).toBe(true);
  });

  it("should preserve prior usageEvents rows through the cutover", async () => {
    // Arrange
    await seedV32(name);

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const prior = await db.table("usageEvents").get(PRIOR_EVENT.id);
    db.close();

    // Assert
    expect(prior?.tokens).toBe(PRIOR_EVENT.tokens);
  });

  it("should preserve an entry-less legacy row as one aggregate chat event", async () => {
    // Arrange
    const older = new Dexie(name);
    older.version(SEED_VERSION).stores(SCHEMAS.v32);
    await older.open();
    await older.table("usage").add({
      yearMonth: "2026-04",
      inputTokens: AGG_INPUT_TOKENS,
      outputTokens: 0,
      totalTokens: AGG_INPUT_TOKENS,
      totalCost: AGG_COST,
      legacy: true,
      entries: [],
    });
    older.close();

    // Act
    const db = new KaiordDatabase(name);
    await db.open();
    const migrated = await migratedEvents(db);
    db.close();

    // Assert
    expect(migrated).toHaveLength(1);
    expect(migrated[0]).toMatchObject({
      purpose: "chat",
      promptTokens: AGG_INPUT_TOKENS,
      tokens: AGG_INPUT_TOKENS,
      cost: AGG_COST,
    });
  });

  it("should not double-migrate when reopened at head", async () => {
    // Arrange
    await seedV32(name);
    const first = new KaiordDatabase(name);
    await first.open();
    first.close();

    // Act
    const second = new KaiordDatabase(name);
    await second.open();
    const migrated = await migratedEvents(second);
    second.close();

    // Assert
    expect(migrated).toHaveLength(MIGRATED_COUNT);
  });
});
