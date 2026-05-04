/**
 * Forward migration v8 → v9 — zone-method-aware reconcile prep.
 *
 * Two row-level mutations applied to every existing profile (per design
 * D-MA7 of zones-method-aware-reconcile):
 *
 *   1. Normalize `method = "manual"` (introduced by sync-zones-band-writes
 *      in the prior train2go-zones-sync-full-bands change) → `"custom"`.
 *   2. Conservatively reclassify `method = "custom"` + zones-clearly-not-
 *      defaults → `method = "user"`. False-negatives produce conflicts
 *      on next sync (handled gracefully); false-positives produce
 *      conflicts forever (avoided).
 *
 * `lastSyncedZonesSnapshot` stays absent for migrated profiles — next
 * sync establishes the baseline.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { hasUserData, reclassifyZoneMethods } from "./dexie-migrations";

const dbName = (suffix: string) => `kaiord-test-v9-${suffix}-${Date.now()}`;

const NOW = "2026-05-04T10:00:00.000Z";

const allZeroHr = () => [
  { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
  { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
  { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
  { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
  { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
];

const userEditedHr = () => [
  { zone: 1, name: "Recovery", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 },
  { zone: 3, name: "Tempo", minBpm: 146, maxBpm: 160 },
  { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 170 },
  { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 187 },
];

const cogganSevenDefaults = () => [
  { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 90 },
  { zone: 4, name: "Lactate Threshold", minPercent: 91, maxPercent: 105 },
  { zone: 5, name: "VO2 Max", minPercent: 106, maxPercent: 120 },
  { zone: 6, name: "Anaerobic Capacity", minPercent: 121, maxPercent: 150 },
  { zone: 7, name: "Neuromuscular Power", minPercent: 151, maxPercent: 200 },
];

const userEditedPower = () => [
  { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 60 },
  { zone: 2, name: "Endurance", minPercent: 61, maxPercent: 80 },
  { zone: 3, name: "Tempo", minPercent: 81, maxPercent: 95 },
  { zone: 4, name: "Lactate Threshold", minPercent: 96, maxPercent: 110 },
  { zone: 5, name: "VO2 Max", minPercent: 111, maxPercent: 130 },
];

const baseProfile = (overrides: Record<string, unknown> = {}) => ({
  id: "00000000-0000-0000-0000-000000000001",
  name: "Pablo",
  bodyWeight: 83,
  sportZones: {},
  linkedAccounts: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const seedV8 = async (name: string, profiles: unknown[]): Promise<void> => {
  const v8 = new Dexie(name);
  v8.version(8).stores({ profiles: "id", aiProviders: "id, createdAt" });
  await v8.open();
  await v8.table("profiles").bulkPut(profiles);
  v8.close();
};

const openV9AndRead = async (name: string, id: string) => {
  const v9 = new KaiordDatabase(name);
  await v9.open();
  const profile = await v9.table("profiles").get(id);
  v9.close();
  return profile;
};

describe("Dexie v8 → v9 migration (zone-method-aware reconcile)", () => {
  let name: string;

  beforeEach(() => {
    name = dbName("apply");
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should leave a freshly-created profile unchanged (1.4a)", async () => {
    // Arrange
    const profile = baseProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: allZeroHr() },
          powerZones: { method: "coggan-7", zones: cogganSevenDefaults() },
        },
        running: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: allZeroHr() },
          powerZones: { method: "custom", zones: [] },
          paceZones: { method: "custom", zones: [] },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.cycling.heartRateZones.method).toBe("custom");
    expect(post.sportZones.cycling.powerZones.method).toBe("coggan-7");
    expect(post.sportZones.running.heartRateZones.method).toBe("custom");
    expect(post.linkedAccounts[0]?.lastSyncedZonesSnapshot).toBeUndefined();
  });

  it("should normalize method = 'manual' to 'custom' (1.4b)", async () => {
    // Arrange — the prior PR 2 sync wrote method = "manual" when seeding
    // a fresh sport config. Migration normalizes that back to "custom".
    const profile = baseProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: { method: "manual", zones: [] },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.cycling.heartRateZones.method).toBe("custom");
  });

  it("should reclassify method = 'custom' + clearly-edited HR zones to 'user' (1.4c)", async () => {
    // Arrange
    const profile = baseProfile({
      sportZones: {
        running: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: userEditedHr() },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.running.heartRateZones.method).toBe("user");
    expect(post.sportZones.running.heartRateZones.zones).toEqual(
      userEditedHr()
    );
  });

  it("should leave method = 'custom' + all-zero seed HR zones unchanged (1.4d)", async () => {
    // Arrange
    const profile = baseProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: allZeroHr() },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.cycling.heartRateZones.method).toBe("custom");
  });

  it("should leave method = 'coggan-7' + Coggan defaults unchanged (1.4e)", async () => {
    // Arrange — formula-derived state stays as-is (the post-migration
    // classifier handles it via "method-derived" detection).
    const profile = baseProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: allZeroHr() },
          powerZones: { method: "coggan-7", zones: cogganSevenDefaults() },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.cycling.powerZones.method).toBe("coggan-7");
    expect(post.sportZones.cycling.powerZones.zones).toEqual(
      cogganSevenDefaults()
    );
  });

  it("should reclassify method = 'coggan-7' + zones-differ-from-formula to 'user' is OUT OF SCOPE for migration (1.4f)", async () => {
    // Arrange — the migration only flips "custom" → "user". A profile
    // with method = "coggan-7" + edited zones stays at "coggan-7"
    // (the post-migration classifier's content-detection tail rule
    // catches this case at sync time, returning user-customized).
    const profile = baseProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: allZeroHr() },
          powerZones: { method: "coggan-7", zones: userEditedPower() },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert — method stays at coggan-7; classifier handles the rest at runtime.
    expect(post.sportZones.cycling.powerZones.method).toBe("coggan-7");
  });

  it("should be idempotent — running the migration twice produces the same result (1.4g)", async () => {
    // Arrange
    const initial = {
      cycling: {
        thresholds: {},
        heartRateZones: { method: "custom", zones: userEditedHr() },
      },
    };
    const profile = baseProfile({ sportZones: initial });

    // Act — apply reclassifyZoneMethods twice (the modifier function is
    // pure; running twice should produce identical result).
    const row1 = JSON.parse(JSON.stringify(profile));
    reclassifyZoneMethods(row1);
    const row2 = JSON.parse(JSON.stringify(row1));
    reclassifyZoneMethods(row2);

    // Assert
    expect(row2.sportZones.cycling.heartRateZones.method).toBe("user");
    expect(row2).toEqual(row1);
    // Already-"user" tables stay "user" on re-run.
    expect(row1.sportZones.cycling.heartRateZones.method).toBe("user");
  });

  it("should apply uniformly to the generic sport (1.4h)", async () => {
    // Arrange
    const profile = baseProfile({
      sportZones: {
        generic: {
          thresholds: {},
          heartRateZones: { method: "custom", zones: userEditedHr() },
        },
      },
    });
    await seedV8(name, [profile]);

    // Act
    const post = await openV9AndRead(name, profile.id);

    // Assert
    expect(post.sportZones.generic.heartRateZones.method).toBe("user");
  });
});

describe("hasUserData heuristic", () => {
  it("should return false for empty zones array", () => {
    // Arrange + Act + Assert
    expect(hasUserData([], "heartRateZones")).toBe(false);
    expect(hasUserData(undefined, "heartRateZones")).toBe(false);
  });

  it("should return false for HR all-zero seed (5 entries)", () => {
    // Arrange + Act + Assert
    expect(hasUserData(allZeroHr(), "heartRateZones")).toBe(false);
  });

  it("should return true for HR with any non-zero band", () => {
    // Arrange + Act + Assert
    expect(hasUserData(userEditedHr(), "heartRateZones")).toBe(true);
  });

  it("should return false for power Coggan-7 defaults (7 entries)", () => {
    // Arrange + Act + Assert
    expect(hasUserData(cogganSevenDefaults(), "powerZones")).toBe(false);
  });

  it("should return true for power zones differing from Coggan-7 defaults", () => {
    // Arrange + Act + Assert
    expect(hasUserData(userEditedPower(), "powerZones")).toBe(true);
  });

  it("should return false for pace all-zero seed (5 entries)", () => {
    // Arrange
    const allZeroPace = [
      { zone: 1, name: "Recovery", minPace: 0, maxPace: 0, unit: "min_per_km" },
      { zone: 2, name: "Aerobic", minPace: 0, maxPace: 0, unit: "min_per_km" },
      { zone: 3, name: "Tempo", minPace: 0, maxPace: 0, unit: "min_per_km" },
      {
        zone: 4,
        name: "Threshold",
        minPace: 0,
        maxPace: 0,
        unit: "min_per_km",
      },
      { zone: 5, name: "VO2 Max", minPace: 0, maxPace: 0, unit: "min_per_km" },
    ];

    // Act + Assert
    expect(hasUserData(allZeroPace, "paceZones")).toBe(false);
  });

  it("should return true for pace zones with any non-zero band", () => {
    // Arrange
    const editedPace = [
      {
        zone: 1,
        name: "Recovery",
        minPace: 350,
        maxPace: 400,
        unit: "min_per_km",
      },
      { zone: 2, name: "Aerobic", minPace: 0, maxPace: 0, unit: "min_per_km" },
      { zone: 3, name: "Tempo", minPace: 0, maxPace: 0, unit: "min_per_km" },
      {
        zone: 4,
        name: "Threshold",
        minPace: 0,
        maxPace: 0,
        unit: "min_per_km",
      },
      { zone: 5, name: "VO2 Max", minPace: 0, maxPace: 0, unit: "min_per_km" },
    ];

    // Act + Assert
    expect(hasUserData(editedPace, "paceZones")).toBe(true);
  });
});
