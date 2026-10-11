/**
 * Leak guard for `sharedKaiordDatabase`. Every case checks that it starts
 * from a database that does not exist yet and has empty tables, then dirties
 * every table and leaves the instance in a different state (open, closed,
 * never opened). Run in any order (`--sequence.shuffle`), whichever case runs
 * after another fails if a row, a connection or a closed state survived.
 */
import "fake-indexeddb/auto";

import Dexie, { type Table } from "dexie";
import { describe, expect, it } from "vitest";

import {
  assertFreshDatabase,
  sharedKaiordDatabase,
} from "./shared-kaiord-database";

const KEY = "leak-probe";

const rowFor = (table: Table): { row: object; key?: string } => {
  const { keyPath } = table.schema.primKey;
  if (keyPath === undefined || keyPath === null || keyPath === "") {
    return { row: { probe: KEY }, key: KEY };
  }
  const parts = Array.isArray(keyPath) ? keyPath : [keyPath];
  return { row: Object.fromEntries(parts.map((p) => [p, KEY])) };
};

const dirtyEveryTable = (db: Dexie): Promise<unknown> =>
  db.transaction("rw", db.tables, () =>
    Promise.all(
      db.tables.map((table) => {
        const { row, key } = rowFor(table);
        return key === undefined ? table.add(row) : table.add(row, key);
      })
    )
  );

const rowCounts = async (db: Dexie): Promise<Record<string, number>> =>
  Object.fromEntries(
    await Promise.all(
      db.tables.map(async (t) => [t.name, await t.count()] as const)
    )
  );

describe("sharedKaiordDatabase", () => {
  const db = sharedKaiordDatabase("leak-guard");

  it.each(["open", "closed", "unopened"] as const)(
    "should start from a newly created, empty database and leave it %s",
    async (endState) => {
      // Arrange
      const existedBefore = await Dexie.exists(db.name);

      // Act
      if (endState !== "unopened") await db.open();
      const counts = await rowCounts(db);
      await dirtyEveryTable(db);
      if (endState === "closed") db.close();

      // Assert
      expect(existedBefore).toBe(false);
      expect(db.tables.length).toBeGreaterThan(30);
      expect(Object.values(counts).every((n) => n === 0)).toBe(true);
    }
  );
});

describe("assertFreshDatabase", () => {
  it("should reject when the database survived a previous test", async () => {
    // Arrange
    const leaked = new Dexie(`kaiord-test-leaked-${Math.random()}`);
    leaked.version(1).stores({ rows: "id" });
    await leaked.open();
    leaked.close();

    // Act
    const result = assertFreshDatabase(leaked);

    // Assert
    await expect(result).rejects.toThrow(/survived the previous test/);
    await leaked.delete();
  });

  it("should reject when the instance is still open", async () => {
    // Arrange
    const open = new Dexie(`kaiord-test-open-${Math.random()}`);
    open.version(1).stores({ rows: "id" });
    await open.open();

    // Act
    const result = assertFreshDatabase(open);

    // Assert
    await expect(result).rejects.toThrow(/survived the previous test/);
    await open.delete();
  });

  it("should resolve for a database that was never created", async () => {
    // Arrange
    const fresh = new Dexie(`kaiord-test-fresh-${Math.random()}`);

    // Act
    const result = assertFreshDatabase(fresh);

    // Assert
    await expect(result).resolves.toBeUndefined();
  });
});
