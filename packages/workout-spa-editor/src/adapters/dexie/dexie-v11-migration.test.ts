/**
 * Forward migration v10 → v11 — `SessionMatch.source` rename.
 *
 * Rewrites legacy `auto-conversion` rows to the canonical
 * `auto-coaching` value. Idempotent.
 */
import "fake-indexeddb/auto";

import Dexie, { type Transaction } from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyV11Upgrade } from "./dexie-v11-migration";

const dbName = (suffix: string) =>
  `kaiord-test-v11-${suffix}-${Date.now()}-${Math.random()}`;

const NOW = "2026-05-08T10:00:00.000Z";
const SCHEMA_V10 = 10;
const SCHEMA_V11 = 11;

const stores = {
  sessionMatches:
    "id, [profileId+coachingActivityId], [profileId+workoutId], [profileId+date], coachingActivityId, workoutId, profileId",
} as const;

const seedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "M1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:12345",
  workoutId: "w-1",
  date: "2026-04-29",
  createdAt: NOW,
  source: "auto-conversion",
  ...overrides,
});

const seedV10 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v10 = new Dexie(name);
  v10.version(SCHEMA_V10).stores(stores);
  await v10.open();
  if (rows.length > 0) {
    await v10.table("sessionMatches").bulkAdd([...rows]);
  }
  v10.close();
};

const openWithV11Migration = async (name: string): Promise<Dexie> => {
  const db = new Dexie(name);
  db.version(SCHEMA_V11).stores(stores).upgrade(applyV11Upgrade);
  await db.open();
  return db;
};

describe("Dexie v10 → v11 migration (SessionMatch.source rename)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should rewrite auto-conversion rows to auto-coaching", async () => {
    // Arrange
    await seedV10(name, [
      seedRow({ id: "M1", source: "auto-conversion" }),
      seedRow({ id: "M2", source: "auto-conversion", workoutId: "w-2" }),
    ]);

    // Act
    const db = await openWithV11Migration(name);

    // Assert
    const rows = (await db.table("sessionMatches").toArray()) as Array<{
      id: string;
      source: string;
    }>;
    expect(rows.map((r) => r.source).sort()).toEqual([
      "auto-coaching",
      "auto-coaching",
    ]);
    db.close();
  });

  it("should leave manual, auto-suggestion, and v10-migration rows untouched", async () => {
    // Arrange
    await seedV10(name, [
      seedRow({ id: "M1", source: "manual" }),
      seedRow({ id: "M2", source: "auto-suggestion", workoutId: "w-2" }),
      seedRow({
        id: "M3",
        source: "auto-coaching-v10-migration",
        workoutId: "w-3",
      }),
    ]);

    // Act
    const db = await openWithV11Migration(name);

    // Assert
    const rows = (await db.table("sessionMatches").toArray()) as Array<{
      id: string;
      source: string;
    }>;
    const sourcesById = new Map(rows.map((r) => [r.id, r.source]));
    expect(sourcesById.get("M1")).toBe("manual");
    expect(sourcesById.get("M2")).toBe("auto-suggestion");
    expect(sourcesById.get("M3")).toBe("auto-coaching-v10-migration");
    db.close();
  });

  it("should be idempotent on re-run (no auto-conversion rows remain to rewrite)", async () => {
    // Arrange
    await seedV10(name, [
      seedRow({ id: "M1", source: "auto-conversion" }),
      seedRow({ id: "M2", source: "manual", workoutId: "w-2" }),
    ]);
    const first = await openWithV11Migration(name);
    first.close();

    // Act
    const second = new Dexie(name);
    second.version(SCHEMA_V11).stores(stores);
    await second.open();
    await second.transaction("rw", ["sessionMatches"], async (tx) =>
      applyV11Upgrade(tx as unknown as Transaction)
    );

    // Assert
    const rows = (await second.table("sessionMatches").toArray()) as Array<{
      id: string;
      source: string;
    }>;
    const sourcesById = new Map(rows.map((r) => [r.id, r.source]));
    expect(sourcesById.get("M1")).toBe("auto-coaching");
    expect(sourcesById.get("M2")).toBe("manual");
    second.close();
  });

  it("should be a no-op on a clean database with no rows", async () => {
    // Arrange
    await seedV10(name, []);

    // Act
    const db = await openWithV11Migration(name);

    // Assert
    expect(await db.table("sessionMatches").toArray()).toHaveLength(0);
    db.close();
  });
});
