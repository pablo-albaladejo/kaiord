/**
 * Forward migration v14 → v15 — userPreferences scratch-sport + AI banner.
 *
 * Seeds a raw Dexie at v14 with calendarView-only rows, reopens via
 * `KaiordDatabase` (which registers v15), and asserts each migrated row
 * still satisfies `userPreferencesSchema.safeParse(...).success === true`.
 * The migration is data-only: existing fields are preserved unchanged,
 * and the new optional fields are normalised to `undefined`.
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
  `kaiord-test-v15-${suffix}-${Date.now()}-${Math.random()}`;

const SCHEMA_V14 = 14;
const NOW = "2026-05-22T10:00:00.000Z";

const STORES_V14 = {
  userPreferences: "profileId",
} as const;

const seedV14 = async (
  name: string,
  rows: ReadonlyArray<Record<string, unknown>>
): Promise<void> => {
  const v14 = new Dexie(name);
  v14.version(SCHEMA_V14).stores(STORES_V14);
  await v14.open();
  if (rows.length > 0) await v14.table("userPreferences").bulkAdd([...rows]);
  v14.close();
};

describe("Dexie v14 → v15 migration (userPreferences scratch + AI banner)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("scratch-banner");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should preserve existing fields and normalise new fields to undefined", async () => {
    // Arrange
    await seedV14(name, [
      { profileId: "p1", calendarView: "grid", updatedAt: NOW },
    ]);

    // Act
    const v15 = new KaiordDatabase(name);
    await v15.open();
    const migrated = (await v15
      .table("userPreferences")
      .get("p1")) as UserPreferences;

    // Assert
    expect(migrated.profileId).toBe("p1");
    expect(migrated.calendarView).toBe("grid");
    expect(migrated.updatedAt).toBe(NOW);
    expect(migrated.lastScratchSport).toBeUndefined();
    expect(migrated.aiBannerExpanded).toBeUndefined();
    expect(userPreferencesSchema.safeParse(migrated).success).toBe(true);
    v15.close();
  });

  it("should migrate every row when multiple profiles exist", async () => {
    // Arrange
    await seedV14(name, [
      { profileId: "p1", calendarView: "grid", updatedAt: NOW },
      { profileId: "p2", calendarView: "list", updatedAt: NOW },
    ]);

    // Act
    const v15 = new KaiordDatabase(name);
    await v15.open();
    const all = (await v15
      .table("userPreferences")
      .toArray()) as UserPreferences[];

    // Assert
    expect(all).toHaveLength(2);
    for (const row of all) {
      expect(userPreferencesSchema.safeParse(row).success).toBe(true);
    }
    v15.close();
  });

  it("should be a no-op on an empty userPreferences table", async () => {
    // Arrange
    await seedV14(name, []);

    // Act
    const v15 = new KaiordDatabase(name);
    await v15.open();
    const all = await v15.table("userPreferences").toArray();

    // Assert
    expect(all).toHaveLength(0);
    v15.close();
  });
});
