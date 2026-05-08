/**
 * `syncZones` + `commitConflictResolution` — method-aware end-to-end
 * tests (per tasks §3.4 of zones-method-aware-reconcile). Companion to
 * `sync-zones-bands.test.ts` (which covered the prior pre-classifier
 * behavior).
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { LastSyncedZonesSnapshot } from "../../types/coaching-account";
import type {
  ConflictDecision,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
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
  readDay: vi.fn(async () => []),
  readZones: vi.fn(async () => PAYLOAD),
});

describe("syncZones method-aware — first-sync (3.4a)", () => {
  it("should produce zero conflicts and flip method to 'train2go' on a fresh profile", async () => {
    // Arrange — fresh profile: cycling has Coggan-7 power; cycling/running/
    // swimming heartRateZones are seeded with all-zero HR.
    const repo = createInMemoryProfileRepository();
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
    const result = await syncZones(PROFILE_ID, makeTransport(), repo);

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
    // Arrange — first sync establishes baseline.
    const repo = createInMemoryProfileRepository();
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
    await syncZones(PROFILE_ID, makeTransport(), repo);

    // Act — second sync against same data.
    const result = await syncZones(PROFILE_ID, makeTransport(), repo);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.conflicts).toEqual([]);
    expect(result.applied).toEqual([]);
  });
});

describe("commitConflictResolution method-aware — accept-all (3.4g)", () => {
  it("should set method = 'train2go' when ALL band conflicts of a table are accepted", async () => {
    // Arrange — profile already user-customized; conflicts emitted; user
    // accepts all 5 cycling-HR band-bound conflicts.
    const repo = createInMemoryProfileRepository();
    await repo.put(
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
    const decisions = {
      "cycling.heartRateZones.z1.minBpm": "accept",
      "cycling.heartRateZones.z1.maxBpm": "accept",
      "cycling.heartRateZones.z2.maxBpm": "accept",
      "cycling.heartRateZones.z4.maxBpm": "accept",
      "cycling.heartRateZones.z5.minBpm": "accept",
    } as Record<FieldKey, ConflictDecision>;

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, repo, PAYLOAD);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.heartRateZones?.method).toBe(
      "train2go"
    );
    expect(
      persisted?.linkedAccounts[0]?.lastSyncedZonesSnapshot?.cyclingHr
    ).toBeDefined();
  });
});

describe("commitConflictResolution method-aware — mixed accept/reject (3.4f)", () => {
  it("should set method = 'user' when SOME but NOT ALL band conflicts are accepted", async () => {
    // Arrange — user accepts Z1 (both bounds) and Z2.maxBpm; rejects Z4.maxBpm and Z5.minBpm.
    const repo = createInMemoryProfileRepository();
    await repo.put(
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
    const decisions = {
      "cycling.heartRateZones.z1.minBpm": "accept",
      "cycling.heartRateZones.z1.maxBpm": "accept",
      "cycling.heartRateZones.z2.maxBpm": "accept",
      "cycling.heartRateZones.z4.maxBpm": "reject",
      "cycling.heartRateZones.z5.minBpm": "reject",
    } as Record<FieldKey, ConflictDecision>;

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, repo, PAYLOAD);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.heartRateZones?.method).toBe("user");
    // Accepted bands took T2G value; rejected bands kept pre-sync.
    const zones = persisted?.sportZones.cycling?.heartRateZones?.zones;
    const ACCEPTED_Z1_MIN = 107;
    const PRESYNC_Z4_MAX = 170;
    const PRESYNC_Z5_MIN = 171;
    expect(zones?.[0].minBpm).toBe(ACCEPTED_Z1_MIN); // accepted
    expect(zones?.[3].maxBpm).toBe(PRESYNC_Z4_MAX); // rejected → pre-sync
    expect(zones?.[4].minBpm).toBe(PRESYNC_Z5_MIN); // rejected → pre-sync
  });
});

describe("commitConflictResolution method-aware — all-reject (3.4d)", () => {
  it("should leave method and snapshot untouched when ALL band decisions are reject", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    const preSnapshot: LastSyncedZonesSnapshot = {
      syncedAt: "2025-01-01T00:00:00.000Z",
      cyclingHr: [],
      runningHr: [],
      swimmingHr: [],
      cyclingPower: [],
      runningPace: [],
      swimmingPace: [],
    } as LastSyncedZonesSnapshot;
    await repo.put(
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
        linkedAccounts: [
          {
            source: "train2go",
            externalUserId: "99999",
            externalUserName: "Pablo",
            linkedAt: NOW,
            syncZones: true,
            lastSyncedZonesSnapshot: preSnapshot,
          },
        ],
      })
    );
    const decisions = {
      "cycling.heartRateZones.z1.minBpm": "reject",
      "cycling.heartRateZones.z1.maxBpm": "reject",
    } as Record<FieldKey, ConflictDecision>;

    // Act
    await commitConflictResolution(PROFILE_ID, decisions, repo, PAYLOAD);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.heartRateZones?.method).toBe("user");
    // Snapshot stays untouched (syncedAt unchanged) per D-MA4 all-reject rule.
    expect(
      persisted?.linkedAccounts[0]?.lastSyncedZonesSnapshot?.syncedAt
    ).toBe("2025-01-01T00:00:00.000Z");
  });
});
