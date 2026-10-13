import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { createDexieClearAllTables } from "./dexie-clear-all-tables";
import type { KaiordDatabase } from "./dexie-database";

describe("createDexieClearAllTables", () => {
  const db = sharedKaiordDatabase("clear-all");

  it("should empty every store of the live schema, tombstones and connections included", async () => {
    // Arrange
    await db.open();
    await db.table("workouts").add({ id: "w-1", profileId: "p-1" });
    await db.table("profiles").add({ id: "p-1", name: "Pablo" });
    await db
      .table("connections")
      .add({ profileId: "p-1", providerId: "garmin" });
    await db
      .table("tombstones")
      .add({ table: "workouts", id: "w-0", deletedAt: "2026-10-01" });
    await db.table("meta").put({ key: "activeProfileId", value: "p-1" });
    const clearAllTables = createDexieClearAllTables(db);

    // Act
    await clearAllTables();

    // Assert
    const counts = await Promise.all(
      db.tables.map(async (t) => [t.name, await t.count()] as const)
    );
    db.close();
    expect(counts.filter(([, count]) => count > 0)).toEqual([]);
  });

  describe("on a store no code names", () => {
    let other: Dexie | null = null;

    afterEach(async () => {
      other?.close();
      if (other !== null) await Dexie.delete(other.name);
      other = null;
    });

    it("should empty it too, because it enumerates the database's stores", async () => {
      // Arrange
      other = new Dexie(`kaiord-test-future-${Date.now()}`);
      other.version(1).stores({ someFutureTable: "id", profiles: "id" });
      await other.table("someFutureTable").add({ id: "x-1" });
      await other.table("profiles").add({ id: "p-1" });
      const clearAllTables = createDexieClearAllTables(
        other as unknown as KaiordDatabase
      );

      // Act
      await clearAllTables();

      // Assert
      expect(await other.table("someFutureTable").count()).toBe(0);
      expect(await other.table("profiles").count()).toBe(0);
    });
  });
});
