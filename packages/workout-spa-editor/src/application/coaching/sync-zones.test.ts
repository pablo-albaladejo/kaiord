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

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const NOW = "2026-04-28T10:00:00.000Z";

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

const PAYLOAD_FULL: ZonesPayload = {
  physiological: { weight: 83, bpmMax: 187 },
  paces: {
    cycling: { z4Upper: 268, z5Lower: 270 },
    running: { z4Upper: { min: 4, sec: 0 } },
    swimming: { z4Upper: { min: 1, sec: 30 } },
  },
  hrZones: {
    cycling: { z4Upper: 160 },
    running: { z4Upper: 168 },
  },
};

describe("syncZones — silent fills and conflicts", () => {
  it("should write every incoming value silently when profile is empty (empty-fill)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => PAYLOAD_FULL);
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.conflicts).toEqual([]);
    expect(result.applied.length).toBeGreaterThanOrEqual(7);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(268);
    expect(after?.sportZones.cycling?.thresholds.lthr).toBe(160);
    expect(after?.sportZones.running?.thresholds.lthr).toBe(168);
    expect(after?.bodyWeight).toBe(83);
    expect(after?.maxHeartRate).toBe(187);
  });

  it("should produce no applied or conflicts when incoming === current (no-op)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        bodyWeight: 83,
        maxHeartRate: 187,
        sportZones: {
          cycling: {
            thresholds: { ftp: 268, lthr: 160 },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: { lthr: 168, thresholdPace: 240 },
            heartRateZones: { method: "manual", zones: [] },
          },
          swimming: {
            thresholds: { thresholdPace: 90 },
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
            thresholds: { ftp: 200 },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      paces: { cycling: { z4Upper: 270 } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.conflicts).toEqual([
      { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
    ]);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(200);
  });

  it("should return per-sport LTHR conflict rows (multi-conflict)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { lthr: 150 },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: { lthr: 155 },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      hrZones: {
        cycling: { z4Upper: 160 },
        running: { z4Upper: 168 },
      },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");

    // Act
    const fields = result.conflicts.map((c) => c.field).sort();

    // Assert
    expect(fields).toEqual([
      "cycling.thresholds.lthr",
      "running.thresholds.lthr",
    ]);
  });

  it("should fill empty bodyWeight and return a conflict for manual FTP (mixed-fill-and-conflict)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { ftp: 200 },
            heartRateZones: { method: "manual", zones: [] },
          },
        },
      })
    );
    const transport = makeTransport(async () => ({
      physiological: { weight: 72 },
      paces: { cycling: { z4Upper: 270 } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);
    if (!result.ok) throw new Error("expected ok");
    expect(result.applied).toEqual([{ field: "bodyWeight", value: 72 }]);
    expect(result.conflicts).toEqual([
      { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
    ]);

    // Act
    const after = await repo.getById(PROFILE_ID);

    // Assert
    expect(after?.bodyWeight).toBe(72);
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(200);
  });

  it("should use z5Lower when z4Upper is undefined (ftp-fallback-absent)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => ({
      paces: { cycling: { z5Lower: 270 } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Act
    if (!result.ok) throw new Error("expected ok");

    // Assert
    expect(result.applied).toContainEqual({
      field: "cycling.thresholds.ftp",
      value: 270,
    });
  });

  it("should use z5Lower when z4Upper === 0 (ftp-fallback-zero)", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => ({
      paces: { cycling: { z4Upper: 0, z5Lower: 270 } },
    }));
    const result = await syncZones(PROFILE_ID, transport, repo);

    // Act
    if (!result.ok) throw new Error("expected ok");

    // Assert
    expect(result.applied).toContainEqual({
      field: "cycling.thresholds.ftp",
      value: 270,
    });
  });

  it("transport-error: thrown exception surfaces as { ok: false, reason: 'transport-error' }", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => {
      throw new Error("Bridge unavailable");
    });
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe("transport-error");
    expect(result.error).toBe("Bridge unavailable");
  });

  it("shape-mismatch: null payload surfaces as { ok: false, reason: 'shape-mismatch' }", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport(async () => null);
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe("shape-mismatch");
  });

  it("unsupported-transport: returns { ok: false, reason: 'unsupported' } when readZones is absent", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    await repo.put(makeProfile());
    const transport = makeTransport();
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe("unsupported");
  });

  it("profile-deleted-mid-sync: missing profile returns { ok: false, reason: 'profile-deleted' }", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();
    const transport = makeTransport(async () => PAYLOAD_FULL);
    const result = await syncZones(PROFILE_ID, transport, repo);
    expect(result.ok).toBe(false);

    // Act
    if (result.ok) throw new Error("unreachable");

    // Assert
    expect(result.reason).toBe("profile-deleted");
  });
});

describe("commitConflictResolution", () => {
  const conflictPayload: ZonesPayload = {
    paces: { cycling: { z4Upper: 270 } },
    hrZones: { running: { z4Upper: 168 } },
  };

  const seedConflictedProfile = async (): Promise<{
    repo: ReturnType<typeof createInMemoryProfileRepository>;
  }> => {
    const repo = createInMemoryProfileRepository();
    await repo.put(
      makeProfile({
        sportZones: {
          cycling: {
            thresholds: { ftp: 200 },
            heartRateZones: { method: "manual", zones: [] },
          },
          running: {
            thresholds: { lthr: 150 },
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
      "cycling.thresholds.ftp": "accept",
      "running.thresholds.lthr": "accept",
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
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(270);
    expect(after?.sportZones.running?.thresholds.lthr).toBe(168);
  });

  it("should leave the profile untouched (all-reject)", async () => {
    // Arrange
    const { repo } = await seedConflictedProfile();
    const decisions: Record<FieldKey, ConflictDecision> = {
      "cycling.thresholds.ftp": "reject",
      "running.thresholds.lthr": "reject",
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
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(200);
    expect(after?.sportZones.running?.thresholds.lthr).toBe(150);
  });

  it("should accept some and reject others, idempotent on second call (mixed)", async () => {
    // Arrange
    const { repo } = await seedConflictedProfile();
    const decisions: Record<FieldKey, ConflictDecision> = {
      "cycling.thresholds.ftp": "reject",
      "running.thresholds.lthr": "accept",
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
    expect(after?.sportZones.cycling?.thresholds.ftp).toBe(200);
    expect(after?.sportZones.running?.thresholds.lthr).toBe(168);
  });

  it("should throw ProfileNotFoundError when profile deleted mid-commit", async () => {
    // Arrange
    const repo = createInMemoryProfileRepository();

    // Act
    const decisions: Record<FieldKey, ConflictDecision> = {
      "cycling.thresholds.ftp": "accept",
    } as Record<FieldKey, ConflictDecision>;

    // Assert
    await expect(
      commitConflictResolution(PROFILE_ID, decisions, repo, conflictPayload)
    ).rejects.toThrow(ProfileNotFoundError);
  });
});
