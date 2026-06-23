/**
 * Integration coverage for the auto-push change signal: the v23 `updatedAt`
 * index must let `orderBy("updatedAt").last()` read the per-table max cheaply,
 * and that max must advance when a row is edited in place (an edit sets
 * `updatedAt` to now). Runs against fake-indexeddb.
 */
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "../adapters/dexie/dexie-database";

const dbName = () => `kaiord-test-sync-token-${Date.now()}-${Math.random()}`;

describe("auto-push change signal (v23 updatedAt index)", () => {
  let db: KaiordDatabase;

  beforeEach(async () => {
    db = new KaiordDatabase(dbName());
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it("should read the latest workout updatedAt via the index", async () => {
    // Arrange
    await db.table("workouts").bulkPut([
      { id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" },
      { id: "w-2", updatedAt: "2026-05-03T00:00:00.000Z" },
    ]);

    // Act
    const last = await db.table("workouts").orderBy("updatedAt").last();

    // Assert
    expect(last?.updatedAt).toBe("2026-05-03T00:00:00.000Z");
  });

  it("should advance the indexed max when a workout is edited in place", async () => {
    // Arrange
    await db.table("workouts").bulkPut([
      { id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" },
      { id: "w-2", updatedAt: "2026-05-03T00:00:00.000Z" },
    ]);

    // Act
    await db
      .table("workouts")
      .update("w-1", { updatedAt: "2026-05-09T00:00:00.000Z" });
    const last = await db.table("workouts").orderBy("updatedAt").last();

    // Assert
    expect(last?.updatedAt).toBe("2026-05-09T00:00:00.000Z");
  });
});
