import { describe, expect, it } from "vitest";

import type { Snapshot } from "../../types/snapshot";
import {
  AUTO_PROFILE_CHOICE_KEY,
  reconcileAutoProfile,
} from "./reconcile-auto-profile";

const AUTO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const R1 = "11111111-1111-4111-8111-111111111111";
const R2 = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-10T12:00:00.000Z");
const PER_PROFILE = ["workouts", "userPreferences"];

const snap = (tables: Snapshot["tables"], tombstones = []): Snapshot => ({
  manifest: {
    schemaVersion: 36,
    deviceId: "d",
    exportedAt: "2026-10-10T00:00:00.000Z",
    encrypted: false,
  },
  tables,
  tombstones,
});

const auto = { id: AUTO, name: "Mi perfil", origin: "auto" };
const real = (id: string, name = id) => ({ id, name });

const merged = (extraProfiles: unknown[] = [], meta: unknown[] = []) =>
  snap(
    {
      profiles: [auto, ...extraProfiles],
      workouts: [{ id: "w-1", profileId: AUTO }],
      meta: [{ key: "activeProfileId", value: AUTO }, ...meta],
    },
    []
  );

describe("reconcileAutoProfile", () => {
  it("should pass through untouched when no auto profile exists", () => {
    // Arrange
    const input = snap({ profiles: [real(R1)], workouts: [] });

    // Act
    const out = reconcileAutoProfile(input, null, PER_PROFILE);

    // Assert
    expect(out).toEqual({
      kind: "ready",
      snapshot: input,
      deviceLocalRekey: null,
    });
  });

  it("should claim the auto profile when the remote is absent", () => {
    // Arrange
    const input = merged();

    // Act
    const out = reconcileAutoProfile(input, null, PER_PROFILE, {
      now: () => NOW,
    });

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tables.profiles).toEqual([
      { ...auto, origin: "local", updatedAt: NOW.toISOString() },
    ]);
    expect(out.deviceLocalRekey).toBeNull();
  });

  it("should re-key onto the single remote profile and take its id as active", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1)] });
    const input = merged([real(R1)]);

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE);

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tables.profiles).toEqual([real(R1)]);
    expect(out.snapshot.tables.workouts).toEqual([
      { id: "w-1", profileId: R1 },
    ]);
    expect(out.snapshot.tables.meta).toEqual([
      { key: "activeProfileId", value: R1 },
    ]);
    expect(out.deviceLocalRekey).toEqual({ from: [AUTO], to: R1 });
  });

  it("should drop the auto profile's tombstones instead of re-keying them onto the target", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1)] });
    const deletedAt = "2026-10-09T00:00:00.000Z";
    const input = {
      ...merged([real(R1)]),
      tombstones: [
        { table: "coachingActivities", id: `${AUTO}:train2go:9`, deletedAt },
        { table: "coachingDayNotes", id: "n-1", deletedAt, profileId: AUTO },
      ],
    };

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE);

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tombstones).toEqual([]);
  });

  it("should keep the target's own row when the auto profile deleted the same natural row", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1)] });
    const targetRow = { id: `${R1}:train2go:9`, profileId: R1 };
    const input = {
      ...merged([real(R1)]),
      tables: {
        ...merged([real(R1)]).tables,
        coachingActivities: [targetRow],
      },
      tombstones: [
        {
          table: "coachingActivities",
          id: `${AUTO}:train2go:9`,
          deletedAt: "2026-10-09T00:00:00.000Z",
        },
      ],
    };

    // Act
    const out = reconcileAutoProfile(input, remote, [
      ...PER_PROFILE,
      "coachingActivities",
    ]);

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tables.coachingActivities).toEqual([targetRow]);
    expect(out.snapshot.tombstones).toEqual([]);
  });

  it("should keep tombstones unrelated to the auto profile unchanged", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1)] });
    const kept = {
      table: "workouts",
      id: "w-gone",
      deletedAt: "2026-10-09T00:00:00.000Z",
    };
    const input = { ...merged([real(R1)]), tombstones: [kept] };

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE);

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tombstones).toEqual([kept]);
  });

  it("should ask for a choice when the remote has several real profiles", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1, "A"), real(R2, "B")] });
    const input = merged([real(R1, "A"), real(R2, "B")]);

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE);

    // Assert
    expect(out).toEqual({
      kind: "needsChoice",
      candidates: [
        { id: R1, name: "A" },
        { id: R2, name: "B" },
      ],
    });
  });

  it("should still ask when the stored choice is not a remote profile", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1), real(R2)] });
    const input = merged([real(R1), real(R2)]);

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE, {
      choice: AUTO,
    });

    // Assert
    expect(out.kind).toBe("needsChoice");
  });

  it("should re-key onto the stored choice and strip the choice row", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1), real(R2)] });
    const input = merged(
      [real(R1), real(R2)],
      [{ key: AUTO_PROFILE_CHOICE_KEY, value: R2 }]
    );

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE, {
      choice: R2,
    });

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tables.workouts).toEqual([
      { id: "w-1", profileId: R2 },
    ]);
    expect(out.snapshot.tables.meta).toEqual([
      { key: "activeProfileId", value: R2 },
    ]);
  });

  it("should not count a remote profile the merge suppressed as a target", () => {
    // Arrange
    const remote = snap({ profiles: [real(R1)] });
    const input = merged();

    // Act
    const out = reconcileAutoProfile(input, remote, PER_PROFILE, {
      now: () => NOW,
    });

    // Assert
    if (out.kind !== "ready") throw new Error("expected ready");
    expect(out.snapshot.tables.profiles).toEqual([
      { ...auto, origin: "local", updatedAt: NOW.toISOString() },
    ]);
  });
});
