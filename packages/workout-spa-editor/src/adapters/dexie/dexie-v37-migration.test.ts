/**
 * Forward migration to v37 — nutrition joins the cloud snapshot. Seeding a
 * real v36 database with intake entries and presets written before they had a
 * sync clock, then opening KaiordDatabase, backfills `updatedAt` (entries
 * from `loggedAt`, presets from `createdAt`) and leaves every other field,
 * and any row that already has a clock, as it was.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { intakeEntryRecordSchema } from "../../types/intake-entry-record";
import { intakePresetRecordSchema } from "../../types/intake-preset-record";
import type { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const SEED_VERSION = 36;
const SCHEMA_HEAD = 37;

const ENTRY = {
  id: "i-1",
  profileId: "p-1",
  date: "2026-10-01",
  loggedAt: "2026-10-01T08:00:00.000Z",
  label: "Oats",
  mealSlot: "breakfast",
  kcal: 350,
  proteinG: 12,
  carbG: 55,
  fatG: 7,
};
const CLOCKED_ENTRY = {
  ...ENTRY,
  id: "i-2",
  updatedAt: "2026-10-02T09:00:00.000Z",
};
const PRESET = {
  id: "pre-1",
  profileId: "p-1",
  label: "Oats",
  kcal: 350,
  proteinG: 12,
  carbG: 55,
  fatG: 7,
  createdAt: "2026-09-01T08:00:00.000Z",
};
const TARGET = {
  profileId: "p-1",
  goalType: "fat_loss",
  startWeightKg: 80,
  targetWeightKg: 75,
  targetDate: "2027-01-01",
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-05T08:00:00.000Z",
};

const seedV36 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v35);
  await older.open();
  await older.table("intakeEntries").bulkAdd([ENTRY, CLOCKED_ENTRY]);
  await older.table("intakePresets").add(PRESET);
  await older.table("energyTargets").add(TARGET);
  older.close();
};

const upgrade = async (db: KaiordDatabase) => {
  await db.open();
  const read = async (table: string, key: string) => db.table(table).get(key);
  const out = {
    version: db.verno,
    entry: await read("intakeEntries", ENTRY.id),
    clocked: await read("intakeEntries", CLOCKED_ENTRY.id),
    preset: await read("intakePresets", PRESET.id),
    target: await read("energyTargets", TARGET.profileId),
  };
  db.close();
  return out;
};

describe("Dexie nutrition sync clock (v37) migration", () => {
  const db = sharedKaiordDatabase("v37");
  const { name } = db;

  it("should backfill an intake entry's updatedAt from loggedAt", async () => {
    // Arrange
    await seedV36(name);

    // Act
    const { version, entry } = await upgrade(db);

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(entry).toStrictEqual({ ...ENTRY, updatedAt: ENTRY.loggedAt });
    expect(intakeEntryRecordSchema.safeParse(entry).success).toBe(true);
  });

  it("should backfill an intake preset's updatedAt from createdAt", async () => {
    // Arrange
    await seedV36(name);

    // Act
    const { preset } = await upgrade(db);

    // Assert
    expect(preset).toStrictEqual({ ...PRESET, updatedAt: PRESET.createdAt });
    expect(intakePresetRecordSchema.safeParse(preset).success).toBe(true);
  });

  it("should leave rows that already carry a clock untouched", async () => {
    // Arrange
    await seedV36(name);

    // Act
    const { clocked, target } = await upgrade(db);

    // Assert
    expect(clocked).toStrictEqual(CLOCKED_ENTRY);
    expect(target).toStrictEqual(TARGET);
  });
});
