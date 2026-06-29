/**
 * `classifyZoneTable` tests — one per state per sport-kind plus edge
 * cases (per tasks §2.2 of zones-method-aware-reconcile).
 */
import { describe, expect, it } from "vitest";

import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type { Profile } from "../../types/profile";
import { calculateHrZones } from "../../utils/calculate-hr-zones";
import { calculatePaceZones } from "../../utils/calculate-pace-zones";
import { calculatePowerZones } from "../../utils/calculate-power-zones";
import { classifyZoneTable } from "./zone-table-classifier";

const NOW = "2026-05-04T10:00:00.000Z";

const baseProfile = (sportZones: unknown = {}): Profile =>
  ({
    id: "00000000-0000-0000-0000-000000000001",
    name: "Pablo",
    sportZones,
    linkedAccounts: [],
    createdAt: NOW,
    updatedAt: NOW,
  }) as Profile;

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

const t2gHr = () => [
  { zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 },
  { zone: 2, name: "Aerobic", minBpm: 134, maxBpm: 147 },
  { zone: 3, name: "Tempo", minBpm: 148, maxBpm: 160 },
  { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 174 },
  { zone: 5, name: "VO2 Max", minBpm: 175, maxBpm: 187 },
];

const allZeroPace = () => [
  {
    zone: 1,
    name: "Recovery",
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km" as const,
  },
  {
    zone: 2,
    name: "Aerobic",
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km" as const,
  },
  {
    zone: 3,
    name: "Tempo",
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km" as const,
  },
  {
    zone: 4,
    name: "Threshold",
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km" as const,
  },
  {
    zone: 5,
    name: "VO2 Max",
    minPace: 0,
    maxPace: 0,
    unit: "min_per_km" as const,
  },
];

const POWER_ZONE_COUNT = 5;

const snapshotFor = (cyclingHrZones: unknown): LastSyncedZonesSnapshot =>
  ({
    syncedAt: NOW,
    cyclingHr: cyclingHrZones,
    runningHr: t2gHr(),
    swimmingHr: t2gHr(),
    cyclingPower: calculatePowerZones("coggan-7").slice(0, POWER_ZONE_COUNT),
    runningPace: allZeroPace(),
    swimmingPace: allZeroPace(),
  }) as LastSyncedZonesSnapshot;

describe("classifyZoneTable — empty (2.2a)", () => {
  it("should return 'empty' when zones array is missing", () => {
    // Arrange

    // Act
    const state = classifyZoneTable(
      baseProfile(),
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("empty");
  });

  it("should return 'empty' when zones array is length 0", () => {
    // Arrange
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "custom", zones: [] },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("empty");
  });
});

describe("classifyZoneTable — default-template (2.2b)", () => {
  it("should return 'default-template' for HR all-zero seed", () => {
    // Arrange
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "custom", zones: allZeroHr() },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("default-template");
  });

  it("should return 'default-template' for pace all-zero seed (5 entries)", () => {
    // Arrange
    const profile = baseProfile({
      running: {
        thresholds: {},
        heartRateZones: { method: "custom", zones: [] },
        paceZones: { method: "custom", zones: allZeroPace() },
      },
    });

    // Act
    const state = classifyZoneTable(profile, "running", "paceZones", undefined);

    // Assert
    expect(state).toBe("default-template");
  });
});

describe("classifyZoneTable — method-derived (2.2c)", () => {
  it("should return 'method-derived' for cycling.powerZones with Coggan-7 defaults", () => {
    // Arrange
    const profile = baseProfile({
      cycling: {
        thresholds: { ftp: 268 },
        heartRateZones: { method: "custom", zones: [] },
        powerZones: {
          method: "coggan-7",
          zones: calculatePowerZones("coggan-7"),
        },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "powerZones",
      undefined
    );

    // Assert
    expect(state).toBe("method-derived");
  });

  it("should return 'method-derived' for HR karvonen-5 + LTHR present + zones match formula", () => {
    // Arrange
    const lthr = 174;
    const profile = baseProfile({
      cycling: {
        thresholds: { lthr },
        heartRateZones: {
          method: "karvonen-5",
          zones: calculateHrZones(lthr, "karvonen-5"),
        },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("method-derived");
  });

  it("should return 'method-derived' for pace daniels-5 + thresholdPace present + zones match", () => {
    // Arrange
    const thresholdPace = 250;
    const profile = baseProfile({
      running: {
        thresholds: { thresholdPace, paceUnit: "min_per_km" },
        heartRateZones: { method: "custom", zones: [] },
        paceZones: {
          method: "daniels-5",
          zones: calculatePaceZones(thresholdPace, "min_per_km", "daniels-5"),
        },
      },
    });

    // Act
    const state = classifyZoneTable(profile, "running", "paceZones", undefined);

    // Assert
    expect(state).toBe("method-derived");
  });
});

describe("classifyZoneTable — train2go-synced-clean (2.2d)", () => {
  it("should return 'train2go-synced-clean' when method = 'train2go' and zones === snapshot", () => {
    // Arrange
    const zones = t2gHr();
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "train2go", zones },
      },
    });
    const snapshot = snapshotFor(t2gHr());

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      snapshot
    );

    // Assert
    expect(state).toBe("train2go-synced-clean");
  });
});

describe("classifyZoneTable — train2go-synced-edited (2.2e)", () => {
  it("should return 'train2go-synced-edited' when method = 'train2go' and zones differ from snapshot", () => {
    // Arrange
    // snapshot says Z2.maxBpm=147; persisted has 145 (user edited).
    const persisted = t2gHr().map((z, i) =>
      i === 1 ? { ...z, maxBpm: 145 } : z
    );
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "train2go", zones: persisted },
      },
    });
    const snapshot = snapshotFor(t2gHr());

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      snapshot
    );

    // Assert
    expect(state).toBe("train2go-synced-edited");
  });
});

describe("classifyZoneTable — user-customized (2.2f, 2.2g)", () => {
  it("should return 'user-customized' when method = 'user'", () => {
    // Arrange
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "user", zones: userEditedHr() },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("user-customized");
  });

  it("should return 'user-customized' for method = 'custom' + non-default zones (tail rule)", () => {
    // Arrange
    // content-detection tail rule: method = "custom" but
    // zones don't match seed/formula. Defensive — covers PR 2/PR 3
    // ship window where method-tracking isn't fully ironclad yet.
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "custom", zones: userEditedHr() },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("user-customized");
  });

  it("should fall through to 'default-template' for HR formula method without threshold + seed zones", () => {
    // Arrange
    // D-MA1 threshold-fallback rule: when method is a formula
    // id but threshold is absent, classifier falls through to content
    // detection. Seed zones → default-template.
    const profile = baseProfile({
      running: {
        thresholds: {}, // no LTHR
        heartRateZones: { method: "karvonen-5", zones: allZeroHr() },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "running",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("default-template");
  });

  it("should return 'user-customized' when method='train2go' but snapshot is null (D-MA1 explicit branch)", () => {
    // Arrange
    const profile = baseProfile({
      cycling: {
        thresholds: {},
        heartRateZones: { method: "train2go", zones: t2gHr() },
      },
    });

    // Act
    const state = classifyZoneTable(
      profile,
      "cycling",
      "heartRateZones",
      undefined
    );

    // Assert
    expect(state).toBe("user-customized");
  });
});
