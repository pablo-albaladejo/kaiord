/**
 * `syncZones` band-level paths — full Z1-Z5 zone tables, HR fallback
 * chain, watts→%FTP conversion, pace inversion, and per-band conflicts.
 *
 * Companion to `sync-zones.test.ts` (which covers the threshold-scalar
 * paths). Tests here verify the full-bands change (PR 2) end-to-end:
 * mapper builds the IncomingMap, reconcile splits silent-fills vs
 * conflicts at band granularity, commitConflictResolution merges per
 * decision.
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type {
  ConflictDecision,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import type { CoachingTransport } from "./coaching-transport-port";
import { commitConflictResolution } from "./commit-conflict-resolution";
import { syncZones } from "./sync-zones";
import { mapPayloadToIncoming } from "./sync-zones-payload-mapper";

const PROFILE_ID = "00000000-0000-0000-0000-000000000002";
const NOW = "2026-05-04T10:00:00.000Z";

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
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
});

const makeTransport = (
  readZones?: CoachingTransport["readZones"]
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(async () => ({
    sessionActive: true,
    externalUserId: "99999",
    externalUserName: "Pablo",
  })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => []),
  ...(readZones ? { readZones } : {}),
});

const HR_GENERIC_BANDS = {
  z1: { lower: 107, upper: 133 },
  z2: { lower: 134, upper: 147 },
  z3: { lower: 148, upper: 160 },
  z4: { lower: 161, upper: 174 },
  z5: { lower: 175, upper: 187 },
};

const HR_RUNNING_BANDS = {
  z1: { lower: 100, upper: 130 },
  z2: { lower: 131, upper: 145 },
  z3: { lower: 146, upper: 157 },
  z4: { lower: 158, upper: 168 },
  z5: { lower: 169, upper: 180 },
};

const POWER_BANDS = {
  z1: { lower: 111, upper: 149 },
  z2: { lower: 150, upper: 203 },
  z3: { lower: 204, upper: 239 },
  z4: { lower: 240, upper: 268 },
  z5: { lower: 269, upper: 386 },
};

const RUN_PACE_BANDS = {
  z4: {
    lower: { min: 4, sec: 44 },
    upper: { min: 4, sec: 10 },
  },
};

const PAYLOAD_TRIATHLETE: ZonesPayload = {
  physiological: { weight: 83, bpmMax: 187, bpmRest: 51 },
  paces: {
    cycling: {
      ...POWER_BANDS,
      z4Upper: 268,
      z5Lower: 269,
    },
    running: {
      ...RUN_PACE_BANDS,
      z4Upper: { min: 4, sec: 10 },
    },
  },
  hrZones: {
    generic: HR_GENERIC_BANDS,
    cycling: { ...HR_GENERIC_BANDS, z4Upper: 174 },
    running: { ...HR_RUNNING_BANDS, z4Upper: 168 },
  },
};

describe("syncZones full-bands — HR fallback chain", () => {
  it("should write running and swimming HR bands from Generic when only cycling Specific is present (4.7a)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const persisted = await repo.getById(PROFILE_ID);
    expect(
      persisted?.sportZones.cycling?.heartRateZones.zones[3]
    ).toMatchObject({
      minBpm: 161,
      maxBpm: 174,
    });
    expect(
      persisted?.sportZones.running?.heartRateZones.zones[3]
    ).toMatchObject({
      minBpm: 158,
      maxBpm: 168,
    });
    // Swimming has no Specific block → falls back to Generic.
    expect(
      persisted?.sportZones.swimming?.heartRateZones.zones[3]
    ).toMatchObject({
      minBpm: 161,
      maxBpm: 174,
    });
  });

  it("should write LTHR scalars for running and swimming from Generic z4Upper when only cycling Specific is present", async () => {
    // Arrange — same fallback chain as bands but for the LTHR scalar.
    // Pablo's account shape: cycling Specific present, running and
    // swimming inherit Generic.
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.thresholds.lthr).toBe(174);
    expect(persisted?.sportZones.running?.thresholds.lthr).toBe(168);
    // Swimming's Specific is absent → Generic z4Upper (174) flows in.
    expect(persisted?.sportZones.swimming?.thresholds.lthr).toBe(174);
  });

  it("should NOT touch a sport's HR bands when both Specific and Generic are absent (4.7j)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const payload: ZonesPayload = {
      physiological: { weight: 83 },
      hrZones: { cycling: { z4Upper: 174, ...HR_GENERIC_BANDS } },
    };
    const transport = makeTransport(async () => payload);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    // Cycling has Specific → present.
    expect(persisted?.sportZones.cycling?.heartRateZones.zones).toHaveLength(5);
    // Running and swimming have neither Specific nor Generic → untouched.
    expect(persisted?.sportZones.running).toBeUndefined();
    expect(persisted?.sportZones.swimming).toBeUndefined();
  });
});

describe("syncZones full-bands — cycling power watts→%FTP", () => {
  it("should convert cycling watts bands to %FTP using payload.paces.cycling.z4Upper as divisor (4.7f)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert — Z4: 240W..268W with FTP=268 → 90%..100% (exact integer)
    const persisted = await repo.getById(PROFILE_ID);
    const z4 = persisted?.sportZones.cycling?.powerZones?.zones[3];
    expect(z4?.minPercent).toBe(90);
    expect(z4?.maxPercent).toBe(100);
    // Z1: 111W..149W with FTP=268 → 41%..56%.
    const z1 = persisted?.sportZones.cycling?.powerZones?.zones[0];
    expect(z1?.minPercent).toBe(41);
    expect(z1?.maxPercent).toBe(56);
  });

  it("should skip cycling power band writes when payload.paces.cycling.z4Upper is absent (4.7h)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const payloadNoFtp: ZonesPayload = {
      paces: {
        cycling: { ...POWER_BANDS },
      },
    };
    const transport = makeTransport(async () => payloadNoFtp);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.powerZones).toBeUndefined();
  });
});

describe("syncZones full-bands — running pace inversion", () => {
  it("should map T2G upper (faster) to minPace and lower (slower) to maxPace (4.7g)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert — Z4 lower 4:44 (slower) → maxPace 284s; upper 4:10 (faster) → minPace 250s
    const persisted = await repo.getById(PROFILE_ID);
    const z4 = persisted?.sportZones.running?.paceZones?.zones[3];
    expect(z4?.minPace).toBe(250);
    expect(z4?.maxPace).toBe(284);
    expect(z4?.unit).toBe("min_per_km");
    expect(z4!.minPace).toBeLessThanOrEqual(z4!.maxPace);
  });
});

describe("syncZones full-bands — re-sync stability (round-trip)", () => {
  it("should produce zero conflicts when re-syncing identical T2G data (4.7r/4.7s)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);
    // First sync — silent-fills the empty profile.
    await syncZones(PROFILE_ID, transport, repo);

    // Act — second sync against identical data.
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Assert
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });
});

describe("syncZones full-bands — bpmRest flow-through-but-not-persisted", () => {
  it("should NOT add a restingHeartRate field after sync even when bpmRest is in the payload (4.7p)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted).toBeDefined();
    if (!persisted) return;
    const allKeys = collectKeys(persisted);
    expect(allKeys.has("restingHeartRate")).toBe(false);
    expect(allKeys.has("bpmRest")).toBe(false);
    expect(allKeys.has("bpm_rest")).toBe(false);
  });
});

describe("syncZones full-bands — power-zone count mismatch", () => {
  it("should write a 5-element array (NOT 7) replacing Kaiord defaults (4.7q)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    const zones = persisted?.sportZones.cycling?.powerZones?.zones;
    expect(zones?.length).toBe(5);
  });
});

describe("commitConflictResolution full-bands — band-level merge", () => {
  it("should accept Z4 maxBpm and reject Z2 maxBpm — merged array reflects both decisions (4.7l)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    // Pre-sync profile with HR Z2 different (will produce a conflict).
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: {},
            heartRateZones: {
              method: "manual",
              zones: [
                { zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 },
                { zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 },
                { zone: 3, name: "Tempo", minBpm: 148, maxBpm: 160 },
                { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 170 },
                { zone: 5, name: "VO2 Max", minBpm: 175, maxBpm: 187 },
              ],
            },
          },
        },
      })
    );

    // Act — accept Z4 maxBpm (170 → 174), reject Z2 maxBpm (145 → 147)
    const decisions = {
      "cycling.heartRateZones.z4.maxBpm": "accept",
      "cycling.heartRateZones.z2.maxBpm": "reject",
    } as Record<FieldKey, ConflictDecision>;
    await commitConflictResolution(
      PROFILE_ID,
      decisions,
      repo,
      PAYLOAD_TRIATHLETE
    );

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    const zones = persisted?.sportZones.cycling?.heartRateZones.zones;
    expect(zones?.[3].maxBpm).toBe(174); // accepted
    expect(zones?.[1].maxBpm).toBe(145); // rejected — pre-sync value
  });
});

describe("mapPayloadToIncoming — direct unit tests for the band paths", () => {
  it("should NOT include any band-level entry derived from payload.physiological.bpmRest (D-FB8)", () => {
    // Arrange
    const payload: ZonesPayload = {
      physiological: { bpmRest: 51 },
    };

    // Act
    const map = mapPayloadToIncoming(payload);

    // Assert — bpmRest must not flow into the IncomingMap.
    for (const key of map.keys()) {
      expect(key.toLowerCase()).not.toContain("rest");
    }
  });

  it("should emit Z1-Z5 minBpm/maxBpm entries for each sport when Generic is the only HR source", () => {
    // Arrange
    const payload: ZonesPayload = {
      hrZones: { generic: HR_GENERIC_BANDS },
    };

    // Act
    const map = mapPayloadToIncoming(payload);

    // Assert
    expect(map.get("cycling.heartRateZones.z1.minBpm")).toBe(107);
    expect(map.get("cycling.heartRateZones.z5.maxBpm")).toBe(187);
    expect(map.get("running.heartRateZones.z3.minBpm")).toBe(148);
    expect(map.get("swimming.heartRateZones.z4.maxBpm")).toBe(174);
  });

  it("should compute power-band percentages exactly (no tolerance) using T2G's z4Upper as divisor", () => {
    // Arrange
    const payload: ZonesPayload = {
      paces: {
        cycling: { ...POWER_BANDS, z4Upper: 268 },
      },
    };

    // Act
    const map = mapPayloadToIncoming(payload);

    // Assert
    expect(map.get("cycling.powerZones.z1.minPercent")).toBe(41);
    expect(map.get("cycling.powerZones.z4.maxPercent")).toBe(100);
  });
});

const collectKeys = (
  node: unknown,
  acc: Set<string> = new Set()
): Set<string> => {
  if (node === null || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const child of node) collectKeys(child, acc);
    return acc;
  }
  for (const key of Object.keys(node as Record<string, unknown>)) {
    acc.add(key);
    collectKeys((node as Record<string, unknown>)[key], acc);
  }
  return acc;
};
