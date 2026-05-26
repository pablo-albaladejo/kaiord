/**
 * `syncZones` + `commitConflictResolution` — application unit tests
 * with in-memory repos.
 *
 * 11 syncZones cases:
 *   empty-fill, no-op, single-conflict, multi-conflict, mixed-fill-and-
 *   conflict, ftp-fallback-absent, ftp-fallback-zero, transport-error,
 *   shape-mismatch, unsupported-transport, profile-deleted-mid-sync.
 * 4 commitConflictResolution cases:
 *   all-accept, all-reject, mixed, profile-deleted-mid-commit.
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type {
  ConflictDecision,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { ProfileNotFoundError } from "../profile/errors";
import type { CoachingTransport } from "./coaching-transport-port";
import { commitConflictResolution } from "./commit-conflict-resolution";
import { syncZones } from "./sync-zones";
import {
  SYNC_ZONES_FIELDS as FIELDS,
  SYNC_ZONES_IDS as IDS,
  SYNC_ZONES_REASONS as REASONS,
  SYNC_ZONES_VALUES as VALUES,
} from "./sync-zones.test-fixtures";

const PROFILE_ID = IDS.profileId;
const NOW = IDS.now;

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: PROFILE_ID,
  name: IDS.externalUserName,
  sportZones: {},
  linkedAccounts: [
    {
      source: IDS.source,
      externalUserId: IDS.externalUserId,
      externalUserName: IDS.externalUserName,
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
  source: IDS.source,
  ping: vi.fn(async () => ({
    sessionActive: true,
    externalUserId: IDS.externalUserId,
    externalUserName: IDS.externalUserName,
  })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => []),
  ...(readZones ? { readZones } : {}),
});

const PAYLOAD_FULL: ZonesPayload = {
  physiological: { weight: VALUES.weight, bpmMax: VALUES.bpmMax },
  paces: {
    cycling: {
      z4Upper: VALUES.cyclingZ4Upper,
      z5Lower: VALUES.cyclingZ5Lower,
    },
    running: {
      z4Upper: {
        min: VALUES.runningPaceZ4UpperMin,
        sec: VALUES.runningPaceZ4UpperSec,
      },
    },
    swimming: {
      z4Upper: {
        min: VALUES.swimmingPaceZ4UpperMin,
        sec: VALUES.swimmingPaceZ4UpperSec,
      },
    },
  },
  hrZones: {
    cycling: { z4Upper: VALUES.cyclingHrZ4Upper },
    running: { z4Upper: VALUES.runningHrZ4Upper },
  },
};

describe("syncZones — silent fills and conflicts", () => {
  it("should write every incoming value silently when profile is empty (empty-fill)", async () => {
    // Arrange
    const MIN_APPLIED_COUNT = 7;
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_FULL);
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.conflicts).toEqual([]);
    expect(result.applied.length).toBeGreaterThanOrEqual(MIN_APPLIED_COUNT);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ4Upper
    );
    expect(after?.sportZones.cycling?.thresholds.lthr).toBe(
      VALUES.cyclingHrZ4Upper
    );
    expect(after?.sportZones.running?.thresholds.lthr).toBe(
      VALUES.runningHrZ4Upper
    );
    expect(after?.bodyWeight).toBe(VALUES.weight);
    expect(after?.maxHeartRate).toBe(VALUES.bpmMax);
  });

  it("should produce no applied or conflicts when incoming === current (no-op)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        bodyWeight: VALUES.weight,
        maxHeartRate: VALUES.bpmMax,
        sportZones: {
          cycling: {
            thresholds: {
              ftp: VALUES.cyclingZ4Upper,
              lthr: VALUES.cyclingHrZ4Upper,
            },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: {
              lthr: VALUES.runningHrZ4Upper,
              thresholdPace: VALUES.runningThresholdPace,
            },
            heartRateZones: { method: "manual", zones: [] },
          },
          swimming: {
            thresholds: { thresholdPace: VALUES.swimmingThresholdPace },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => PAYLOAD_FULL);
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Act
    if (!result.ok) throw new Error("expected ok");

    // Assert
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("should return one conflict (NOT written) for differing FTP (single-conflict)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { ftp: VALUES.cyclingZ4UpperLow },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      paces: { cycling: { z4Upper: VALUES.cyclingZ5Lower } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.conflicts).toEqual([
      {
        field: FIELDS.cyclingFtp,
        current: VALUES.cyclingZ4UpperLow,
        incoming: VALUES.cyclingZ5Lower,
      },
    ]);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ4UpperLow
    );
  });

  it("should return per-sport LTHR conflict rows (multi-conflict)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { lthr: VALUES.cyclingHrLthrLow },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: { lthr: VALUES.runningHrLthrLow },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      hrZones: {
        cycling: { z4Upper: VALUES.cyclingHrZ4Upper },
        running: { z4Upper: VALUES.runningHrZ4Upper },
      },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");

    // Act
    const fields = result.conflicts.map((c) => c.field).sort();

    // Assert
    expect(fields).toEqual([FIELDS.cyclingLthr, FIELDS.runningLthr]);
  });

  it("should fill empty bodyWeight and return a conflict for manual FTP (mixed-fill-and-conflict)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { ftp: VALUES.cyclingZ4UpperLow },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      physiological: { weight: VALUES.bodyWeightLow },
      paces: { cycling: { z4Upper: VALUES.cyclingZ5Lower } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([
      { field: FIELDS.bodyWeight, value: VALUES.bodyWeightLow },
    ]);
    expect(result.conflicts).toEqual([
      {
        field: FIELDS.cyclingFtp,
        current: VALUES.cyclingZ4UpperLow,
        incoming: VALUES.cyclingZ5Lower,
      },
    ]);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.bodyWeight).toBe(VALUES.bodyWeightLow);
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ4UpperLow
    );
  });

  it("should use z5Lower when z4Upper is undefined (ftp-fallback-absent)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => ({
      paces: { cycling: { z5Lower: VALUES.cyclingZ5Lower } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Act
    if (!result.ok) throw new Error("expected ok");

    // Assert
    expect(result.applied).toContainEqual({
      field: FIELDS.cyclingFtp,
      value: VALUES.cyclingZ5Lower,
    });
  });

  it("should use z5Lower when z4Upper === 0 (ftp-fallback-zero)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => ({
      paces: {
        cycling: {
          z4Upper: VALUES.zeroValue,
          z5Lower: VALUES.cyclingZ5Lower,
        },
      },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Act
    if (!result.ok) throw new Error("expected ok");

    // Assert
    expect(result.applied).toContainEqual({
      field: FIELDS.cyclingFtp,
      value: VALUES.cyclingZ5Lower,
    });
  });

  it("should surface { ok: false, reason: 'transport-error' } when a transport-error exception is thrown", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => {
      throw new Error(REASONS.bridgeUnavailable);
    });
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe(REASONS.transportError);
    expect(result.error).toBe(REASONS.bridgeUnavailable);
  });

  it("should surface { ok: false, reason: 'shape-mismatch' } when payload is null (shape-mismatch)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => null);
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe(REASONS.shapeMismatch);
  });

  it("should return { ok: false, reason: 'unsupported' } when readZones is absent (unsupported-transport)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport();
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe(REASONS.unsupported);
  });

  it("should return { ok: false, reason: 'profile-deleted' } when profile is missing mid-sync", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    const transport = makeTransport(async () => PAYLOAD_FULL);
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe(REASONS.profileDeleted);
  });
});

describe("commitConflictResolution", () => {
  const conflictPayload: ZonesPayload = {
    paces: { cycling: { z4Upper: VALUES.cyclingZ5Lower } },
    hrZones: { running: { z4Upper: VALUES.runningHrZ4Upper } },
  };

  const seedConflictedProfile = async (): Promise<{
    repo: ReturnType<typeof createInMemoryProfileRepository>;
  }> => {
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { ftp: VALUES.cyclingZ4UpperLow },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: { lthr: VALUES.cyclingHrLthrLow },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    return { repo };
  };

  it("should write every accepted field (all-accept)", async () => {
    // Arrange
    const { repo } = await seedConflictedProfile();
    const decisions: Record<FieldKey, ConflictDecision> = {
      [FIELDS.cyclingFtp]: "accept",
      [FIELDS.runningLthr]: "accept",
    } as Record<FieldKey, ConflictDecision>;
    await commitConflictResolution(
      PROFILE_ID,
      decisions,
      repo,
      conflictPayload
    );

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ5Lower
    );
    expect(after?.sportZones.running?.thresholds.lthr).toBe(
      VALUES.runningHrZ4Upper
    );
  });

  it("should leave the profile untouched (all-reject)", async () => {
    // Arrange
    const { repo } = await seedConflictedProfile();
    const decisions: Record<FieldKey, ConflictDecision> = {
      [FIELDS.cyclingFtp]: "reject",
      [FIELDS.runningLthr]: "reject",
    } as Record<FieldKey, ConflictDecision>;
    await commitConflictResolution(
      PROFILE_ID,
      decisions,
      repo,
      conflictPayload
    );

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ4UpperLow
    );
    expect(after?.sportZones.running?.thresholds.lthr).toBe(
      VALUES.cyclingHrLthrLow
    );
  });

  it("should accept some and reject others, idempotent on second call (mixed)", async () => {
    // Arrange
    const { repo } = await seedConflictedProfile();
    const decisions: Record<FieldKey, ConflictDecision> = {
      [FIELDS.cyclingFtp]: "reject",
      [FIELDS.runningLthr]: "accept",
    } as Record<FieldKey, ConflictDecision>;
    await commitConflictResolution(
      PROFILE_ID,
      decisions,
      repo,
      conflictPayload
    );
    await commitConflictResolution(
      PROFILE_ID,
      decisions,
      repo,
      conflictPayload
    );

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(
      VALUES.cyclingZ4UpperLow
    );
    expect(after?.sportZones.running?.thresholds.lthr).toBe(
      VALUES.runningHrZ4Upper
    );
  });

  it("should throw ProfileNotFoundError when profile deleted mid-commit", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();

    // Act
    const decisions: Record<FieldKey, ConflictDecision> = {
      [FIELDS.cyclingFtp]: "accept",
    } as Record<FieldKey, ConflictDecision>;

    // Assert
    await expect(
      commitConflictResolution(PROFILE_ID, decisions, repo, conflictPayload)
    ).rejects.toThrow(ProfileNotFoundError);
  });
});
