/**
 * Forward migration v13 → v14 — userPreferences calendar rename.
 *
 * Seeds a raw Dexie at v13 with the legacy `calendarDensity` field,
 * reopens the database with `KaiordDatabase` (which registers v14),
 * and asserts the row has been rewritten to `calendarView = "grid"`
 * with the legacy field removed. The migrated row MUST also satisfy
 * `userPreferencesSchema.safeParse(...).success === true`, so future
 * Zod schema drift breaks this test rather than the production
 * calendar page.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type UserPreferences,
  userPreferencesSchema,
} from "../../types/user-preferences";
import { KaiordDatabase } from "./dexie-database";

const dbName = (suffix: string) =>
  `kaiord-test-v14-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_V13 = 13;
const NOW = "2026-05-08T10:00:00.000Z";

const STORES_V13 = {
  userPreferences: "profileId",
} as const;

const seedV13 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v13 = new Dexie(name);
  v13.version(SCHEMA_V13).stores(STORES_V13);
  await v13.open();
  if (rows.length > 0) await v13.table("userPreferences").bulkAdd([...rows]);
  v13.close();
};

describe("Dexie v13 → v14 migration (userPreferences calendar rename)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("rename");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should rewrite a comfortable row to calendarView=grid and drop calendarDensity", async () => {
    // Arrange
    await seedV13(name, [
      { profileId: "p1", calendarDensity: "comfortable", updatedAt: NOW },
    ]);

    // Act
    const v14 = new KaiordDatabase(name);
    await v14.open();
    const migrated = (await v14
      .table("userPreferences")
      .get("p1")) as UserPreferences & { calendarDensity?: unknown };

    // Assert
    expect(migrated).toEqual({
      profileId: "p1",
      calendarView: "grid",
      updatedAt: NOW,
    });
    expect(migrated.calendarDensity).toBeUndefined();
    expect(userPreferencesSchema.safeParse(migrated).success).toBe(true);
    v14.close();
  });

  it("should rewrite a compact row to calendarView=grid and drop calendarDensity", async () => {
    // Arrange
    await seedV13(name, [
      { profileId: "p1", calendarDensity: "compact", updatedAt: NOW },
    ]);

    // Act
    const v14 = new KaiordDatabase(name);
    await v14.open();
    const migrated = (await v14
      .table("userPreferences")
      .get("p1")) as UserPreferences & { calendarDensity?: unknown };

    // Assert
    expect(migrated).toEqual({
      profileId: "p1",
      calendarView: "grid",
      updatedAt: NOW,
    });
    expect(migrated.calendarDensity).toBeUndefined();
    expect(userPreferencesSchema.safeParse(migrated).success).toBe(true);
    v14.close();
  });

  it("should migrate every row when multiple profiles exist", async () => {
    // Arrange
    await seedV13(name, [
      { profileId: "p1", calendarDensity: "comfortable", updatedAt: NOW },
      { profileId: "p2", calendarDensity: "compact", updatedAt: NOW },
    ]);

    // Act
    const v14 = new KaiordDatabase(name);
    await v14.open();
    const all = (await v14
      .table("userPreferences")
      .toArray()) as UserPreferences[];

    // Assert
    expect(all).toHaveLength(2);
    for (const row of all) {
      expect(row.calendarView).toBe("grid");
      expect(
        (row as UserPreferences & { calendarDensity?: unknown }).calendarDensity
      ).toBeUndefined();
      expect(userPreferencesSchema.safeParse(row).success).toBe(true);
    }
    v14.close();
  });

  it("should be a no-op on an empty userPreferences table", async () => {
    // Arrange
    await seedV13(name, []);

    // Act
    const v14 = new KaiordDatabase(name);
    await v14.open();
    const all = await v14.table("userPreferences").toArray();

    // Assert
    expect(all).toHaveLength(0);
    v14.close();
  });
});
