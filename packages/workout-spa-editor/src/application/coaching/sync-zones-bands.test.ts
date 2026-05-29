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

import {
  FTP_DIVISOR_268,
  HR_GENERIC_BANDS,
  HR_RUNNING_BANDS,
  HR_ZONES_LENGTH_5,
  LTHR_CYCLING_174,
  LTHR_RUNNING_168,
  MANUAL_HR_BANDS_PRESYNC,
  MAP_GET_Z1_MINBPM_107,
  MAP_GET_Z3_MINBPM_148,
  MAP_GET_Z4_MAXBPM_174,
  MAP_GET_Z5_MAXBPM_187,
  PACE_Z4_MAX_SEC_284,
  PACE_Z4_MIN_SEC_250,
  PHYSIOLOGICAL_TRIATHLETE,
  POWER_BANDS,
  POWER_ZONES_LENGTH_5,
  RUN_PACE_BANDS,
  RUN_PACE_Z4_UPPER,
  Z1_MAX_PERCENT_56,
  Z1_MIN_PERCENT_41,
  Z2_MAXBPM_REJECTED_145,
  Z4_MAX_PERCENT_100,
  Z4_MAXBPM_ACCEPTED_174,
  Z4_MIN_PERCENT_90,
  Z5_LOWER_269,
} from "../../test-utils/application-fixtures";
import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
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
    } satisfies LinkedCoachingAccount,
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

const PAYLOAD_TRIATHLETE: ZonesPayload = {
  physiological: PHYSIOLOGICAL_TRIATHLETE,
  paces: {
    cycling: {
      ...POWER_BANDS,
      z4Upper: FTP_DIVISOR_268,
      z5Lower: Z5_LOWER_269,
    },
    running: {
      ...RUN_PACE_BANDS,
      z4Upper: RUN_PACE_Z4_UPPER,
    },
  },
  hrZones: {
    generic: HR_GENERIC_BANDS,
    cycling: { ...HR_GENERIC_BANDS, z4Upper: LTHR_CYCLING_174 },
    running: { ...HR_RUNNING_BANDS, z4Upper: LTHR_RUNNING_168 },
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
      maxBpm: LTHR_CYCLING_174,
    });
    expect(
      persisted?.sportZones.running?.heartRateZones.zones[3]
    ).toMatchObject({
      minBpm: 158,
      maxBpm: LTHR_RUNNING_168,
    });
    // Swimming has no Specific block → falls back to Generic.
    expect(
      persisted?.sportZones.swimming?.heartRateZones.zones[3]
    ).toMatchObject({
      minBpm: 161,
      maxBpm: LTHR_CYCLING_174,
    });
  });

  it("should write LTHR scalars for cycling and running from Specific blocks and for swimming from Generic when its Specific block is absent", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_TRIATHLETE);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    // Cycling Specific present (z4Upper=174) and running Specific
    // present (z4Upper=168 from HR_RUNNING_BANDS) — both write the
    // sport's own scalar. Swimming has no Specific block, so the
    // fallback chain reads Generic z4Upper (174).
    const persisted = await repo.getById(PROFILE_ID);
    expect(persisted?.sportZones.cycling?.thresholds.lthr).toBe(
      LTHR_CYCLING_174
    );
    expect(persisted?.sportZones.running?.thresholds.lthr).toBe(
      LTHR_RUNNING_168
    );
    expect(persisted?.sportZones.swimming?.thresholds.lthr).toBe(
      LTHR_CYCLING_174
    );
  });

  it("should NOT touch a sport's HR bands when both Specific and Generic are absent (4.7j)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const payload: ZonesPayload = {
      physiological: { weight: 83 },
      hrZones: { cycling: { z4Upper: LTHR_CYCLING_174, ...HR_GENERIC_BANDS } },
    };
    const transport = makeTransport(async () => payload);

    // Act
    await syncZones(PROFILE_ID, transport, repo);

    // Assert
    const persisted = await repo.getById(PROFILE_ID);
    // Cycling has Specific → present.
    expect(persisted?.sportZones.cycling?.heartRateZones.zones).toHaveLength(
      HR_ZONES_LENGTH_5
    );
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

    // Assert
    // Z4: 240W..268W with FTP=268 → 90%..100% (exact integer).
    const persisted = await repo.getById(PROFILE_ID);
    const z4 = persisted?.sportZones.cycling?.powerZones?.zones[3];
    expect(z4?.minPercent).toBe(Z4_MIN_PERCENT_90);
    expect(z4?.maxPercent).toBe(Z4_MAX_PERCENT_100);
    // Z1: 111W..149W with FTP=268 → 41%..56%.
    const z1 = persisted?.sportZones.cycling?.powerZones?.zones[0];
    expect(z1?.minPercent).toBe(Z1_MIN_PERCENT_41);
    expect(z1?.maxPercent).toBe(Z1_MAX_PERCENT_56);
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

    // Assert
    // Z4 lower 4:44 (slower) → maxPace 284s; upper 4:10 (faster) → minPace 250s.
    const persisted = await repo.getById(PROFILE_ID);
    const z4 = persisted?.sportZones.running?.paceZones?.zones[3];
    expect(z4?.minPace).toBe(PACE_Z4_MIN_SEC_250);
    expect(z4?.maxPace).toBe(PACE_Z4_MAX_SEC_284);
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

    // Act
    // Second sync against identical data.
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
    expect(zones?.length).toBe(POWER_ZONES_LENGTH_5);
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
              zones: [...MANUAL_HR_BANDS_PRESYNC],
            },
          },
        },
      })
    );

    // Act
    // Accept Z4 maxBpm (170 → 174), reject Z2 maxBpm (145 → 147).
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
    expect(zones?.[3].maxBpm).toBe(Z4_MAXBPM_ACCEPTED_174); // accepted
    expect(zones?.[1].maxBpm).toBe(Z2_MAXBPM_REJECTED_145); // rejected — pre-sync value
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

    // Assert
    // bpmRest must not flow into the IncomingMap.
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
    expect(map.get("cycling.heartRateZones.z1.minBpm")).toBe(
      MAP_GET_Z1_MINBPM_107
    );
    expect(map.get("cycling.heartRateZones.z5.maxBpm")).toBe(
      MAP_GET_Z5_MAXBPM_187
    );
    expect(map.get("running.heartRateZones.z3.minBpm")).toBe(
      MAP_GET_Z3_MINBPM_148
    );
    expect(map.get("swimming.heartRateZones.z4.maxBpm")).toBe(
      MAP_GET_Z4_MAXBPM_174
    );
  });

  it("should compute power-band percentages exactly (no tolerance) using T2G's z4Upper as divisor", () => {
    // Arrange
    const payload: ZonesPayload = {
      paces: {
        cycling: { ...POWER_BANDS, z4Upper: FTP_DIVISOR_268 },
      },
    };

    // Act
    const map = mapPayloadToIncoming(payload);

    // Assert
    expect(map.get("cycling.powerZones.z1.minPercent")).toBe(Z1_MIN_PERCENT_41);
    expect(map.get("cycling.powerZones.z4.maxPercent")).toBe(
      Z4_MAX_PERCENT_100
    );
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
