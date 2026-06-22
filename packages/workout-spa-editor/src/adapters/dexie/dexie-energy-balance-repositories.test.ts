/**
 * Dexie energy-balance repositories — exercised against a real (fake-indexeddb)
 * Dexie instance at head schema (v25), focusing on the per-profile reads and
 * the cascade `deleteByProfile` range-delete on the compound intake index.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { createDexieEnergyBalanceRepositories } from "./dexie-energy-balance-repositories";

const dbName = () => `kaiord-test-energy-${Date.now()}-${Math.random()}`;

const UPDATED_TARGET_WEIGHT_KG = 70;

const entry = (id: string, profileId: string, date: string) => ({
  id,
  profileId,
  date,
  loggedAt: "2026-06-21T08:00:00.000Z",
  kcal: 500,
  proteinG: 30,
  carbG: 50,
  fatG: 15,
});

describe("createDexieEnergyBalanceRepositories", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName();
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should read intake entries for a profile and date", async () => {
    // Arrange
    const repos = createDexieEnergyBalanceRepositories(db);
    await repos.intakeEntries.put(entry("i-1", "p-1", "2026-06-21"));
    await repos.intakeEntries.put(entry("i-2", "p-1", "2026-06-20"));

    // Act
    const rows = await repos.intakeEntries.getByProfileAndDate(
      "p-1",
      "2026-06-21"
    );

    // Assert
    expect(rows.map((r) => r.id)).toEqual(["i-1"]);
  });

  it("should cascade-delete only the target profile's intake entries", async () => {
    // Arrange
    const repos = createDexieEnergyBalanceRepositories(db);
    await repos.intakeEntries.put(entry("i-1", "p-1", "2026-06-21"));
    await repos.intakeEntries.put(entry("i-2", "p-1", "2026-06-20"));
    await repos.intakeEntries.put(entry("i-3", "p-2", "2026-06-21"));

    // Act
    await repos.intakeEntries.deleteByProfile("p-1");
    const remaining = await db.table("intakeEntries").toArray();

    // Assert
    expect(remaining.map((r) => (r as { id: string }).id)).toEqual(["i-3"]);
  });

  it("should keep one energy target per profile on put", async () => {
    // Arrange
    const repos = createDexieEnergyBalanceRepositories(db);
    const base = {
      profileId: "p-1",
      goalType: "fat_loss" as const,
      startWeightKg: 80,
      targetWeightKg: 75,
      targetDate: "2026-09-01",
      createdAt: "2026-06-21T08:00:00.000Z",
      updatedAt: "2026-06-21T08:00:00.000Z",
    };

    // Act
    await repos.energyTargets.put(base);
    await repos.energyTargets.put({
      ...base,
      targetWeightKg: UPDATED_TARGET_WEIGHT_KG,
    });
    const stored = await repos.energyTargets.get("p-1");

    // Assert
    expect(stored?.targetWeightKg).toBe(UPDATED_TARGET_WEIGHT_KG);
  });

  it("should list presets for a profile", async () => {
    // Arrange
    const repos = createDexieEnergyBalanceRepositories(db);
    const preset = {
      id: "pre-1",
      profileId: "p-1",
      label: "breakfast",
      kcal: 400,
      proteinG: 20,
      carbG: 40,
      fatG: 10,
      createdAt: "2026-06-21T08:00:00.000Z",
    };
    await repos.intakePresets.put(preset);
    await repos.intakePresets.put({ ...preset, id: "pre-2", profileId: "p-2" });

    // Act
    const rows = await repos.intakePresets.getByProfile("p-1");

    // Assert
    expect(rows.map((r) => r.id)).toEqual(["pre-1"]);
  });
});
