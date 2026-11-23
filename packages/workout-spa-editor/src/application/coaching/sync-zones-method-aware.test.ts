/**
 * `syncZones` + `commitConflictResolution` — method-aware end-to-end
 * tests (per tasks §3.4 of zones-method-aware-reconcile). Companion to
 * `sync-zones-bands.test.ts` (which covered the prior pre-classifier
 * behavior).
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { ZonesPayload } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { DEFAULT_HEART_RATE_ZONES } from "../../types/profile";
import { calculatePowerZones } from "../../utils/calculate-power-zones";
import type { CoachingTransport } from "./coaching-transport-port";
import { commitConflictResolution } from "./commit-conflict-resolution";
import { syncZones } from "./sync-zones";

const PROFILE_ID = "00000000-0000-0000-0000-000000000777";
const NOW = "2026-05-05T10:00:00.000Z";

const T2G_HR = {
  z1: { lower: 107, upper: 133 },
  z2: { lower: 134, upper: 147 },
  z3: { lower: 148, upper: 160 },
  z4: { lower: 161, upper: 174 },
  z5: { lower: 175, upper: 187 },
};

// The same bands as stored, written out independently.
const T2G_HR_BANDS_EXPECTED = [
  { minBpm: 107, maxBpm: 133 },
  { minBpm: 134, maxBpm: 147 },
  { minBpm: 148, maxBpm: 160 },
  { minBpm: 161, maxBpm: 174 },
  { minBpm: 175, maxBpm: 187 },
];

const T2G_POWER = {
  z1: { lower: 111, upper: 149 },
  z2: { lower: 150, upper: 203 },
  z3: { lower: 204, upper: 239 },
  z4: { lower: 240, upper: 268 },
  z5: { lower: 269, upper: 386 },
};

const PAYLOAD: ZonesPayload = {
  physiological: { weight: 83, bpmMax: 187 },
  paces: { cycling: { ...T2G_POWER, z4Upper: 268, z5Lower: 269 } },
  hrZones: { generic: T2G_HR },
};

const makeProfile = (overrides: Partial<Profile> = {}): Profile =>
  ({
    id: PROFILE_ID,
    name: "Pablo",
    sportZones: {},
    linkedAccounts: [
      {
        source: "train2go",
        externalUserId: "99999",
        externalUserName: "Pablo",
        linkedAt: NOW,
        syncZones: true,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }) as Profile;

const makeTransport = (): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(async () => ({
    sessionActive: true,
    externalUserId: "99999",
    externalUserName: "Pablo",
  })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => ({ activities: [] })),
  readZones: vi.fn(async () => PAYLOAD),
});

describe("syncZones method-aware — first-sync (3.4a)", () => {
  it("should produce zero conflicts and flip method to 'train2go' on a fresh profile", async () => {
    // Arrange
    // Fresh profile: cycling has Coggan-7 power; cycling/running/
    // swimming heartRateZones are seeded with all-zero HR.
    const persistence = createInMemoryPersistence();
    const repo = persistence.profiles;
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: {},
            heartRateZones: {
              method: "custom",
              zones: DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z })),
            },
            powerZones: {
              method: "coggan-7",
              zones: calculatePowerZones("coggan-7"),
            },
          },
          running: {
            thresholds: {},
            heartRateZones: {
              method: "custom",
              zones: DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z })),
            },
          },
          swimming: {
            thresholds: {},
            heartRateZones: {
              method: "custom",
              zones: DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z })),
            },
          },
        },
      })
    );

    // Act
    const result = await syncZones(PROFILE_ID, makeTransport(), persistence);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.conflicts).toEqual([]);
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.heartRateZones?.method).toBe(
      "train2go"
    );
    expect(persisted?.sportZones.running?.heartRateZones?.method).toBe(
      "train2go"
    );
    expect(persisted?.sportZones.cycling?.powerZones?.method).toBe("train2go");
    expect(
      persisted?.sportZones.cycling?.heartRateZones?.zones[3]
    ).toMatchObject({ minBpm: 161, maxBpm: 174 });
    // Snapshot established.
    expect(persisted?.linkedAccounts[0]?.lastSyncedZonesSnapshot).toBeDefined();
  });
});

describe("syncZones method-aware — re-sync stability (3.4b)", () => {
  it("should produce zero conflicts AND zero applied entries on re-sync of unchanged data", async () => {
    // Arrange
    // First sync establishes baseline.
    const persistence = createInMemoryPersistence();
    const repo = persistence.profiles;
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: {},
            heartRateZones: {
              method: "custom",
              zones: DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z })),
            },
          },
        },
      })
    );
    await syncZones(PROFILE_ID, makeTransport(), persistence);

    // Act
    // Second sync against same data.
    const result = await syncZones(PROFILE_ID, makeTransport(), persistence);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.conflicts).toEqual([]);
    expect(result.applied).toEqual([]);
  });
});

const seedUserCustomizedHr = async () => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(
    makeProfile({
      sportZones: {
        cycling: {
          thresholds: {},
          heartRateZones: {
            method: "user",
            zones: [
              { zone: 1, name: "Recovery", minBpm: 100, maxBpm: 130 },
              { zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 },
              { zone: 3, name: "Tempo", minBpm: 146, maxBpm: 160 },
              { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 170 },
              { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 187 },
            ],
          },
        },
      },
    })
  );
  return persistence;
};

describe("commitConflictResolution method-aware — every band taken (3.4g)", () => {
  it("should set method = 'train2go' and record the snapshot when every differing band is taken", async () => {
    // Arrange
    const persistence = await seedUserCustomizedHr();
    const sync = await syncZones(PROFILE_ID, makeTransport(), persistence);
    if (!sync.ok) throw new Error("expected ok");

    // Act
    await commitConflictResolution(PROFILE_ID, sync.conflicts, persistence);

    // Assert
    const persisted = await persistence.profiles.getById(PROFILE_ID);
    const hr = persisted?.sportZones.cycling?.heartRateZones;
    expect(hr?.method).toBe("train2go");
    expect(hr?.zones.map(({ minBpm, maxBpm }) => ({ minBpm, maxBpm }))).toEqual(
      T2G_HR_BANDS_EXPECTED
    );
    expect(
      persisted?.linkedAccounts[0]?.lastSyncedZonesSnapshot?.cyclingHr
    ).toEqual(hr?.zones);
  });

  it("should offer nothing on the next sync once Train2Go's bands are taken", async () => {
    // Arrange
    const persistence = await seedUserCustomizedHr();
    const sync = await syncZones(PROFILE_ID, makeTransport(), persistence);
    if (!sync.ok) throw new Error("expected ok");
    await commitConflictResolution(PROFILE_ID, sync.conflicts, persistence);

    // Act
    const again = await syncZones(PROFILE_ID, makeTransport(), persistence);

    // Assert
    if (!again.ok) throw new Error("expected ok");
    expect(again.conflicts).toEqual([]);
  });
});
