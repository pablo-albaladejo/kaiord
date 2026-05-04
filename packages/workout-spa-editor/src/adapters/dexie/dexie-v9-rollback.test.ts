/**
 * v8/v9 rollback regression test (zones-method-aware-reconcile §1.6.5).
 *
 * IndexedDB doesn't permit version downgrade — "rollback" means
 * deploying the OLD JS bundle (pre-PR 1) while the user's local DB
 * has already been migrated to v9. This test asserts: running the
 * frozen v8-shipped reconcile against a v9-migrated profile produces
 * no silent data loss — `method = "user"` tables (introduced by the
 * v9 migration's conservative reclassification) still route to the
 * per-band conflict path under the old reconcile, exactly as if they
 * had stayed at `method = "custom"` + populated zones.
 *
 * The frozen v8 reconcile lives at
 * `src/test-utils/v8-reconcile-snapshot.ts` with a `@frozen-snapshot-of`
 * JSDoc anchoring it to commit `f954d405`.
 */
import { describe, expect, it } from "vitest";

import {
  readField,
  writeField,
} from "../../application/coaching/sync-zones-profile-fields";
import { v8Reconcile } from "../../test-utils/v8-reconcile-snapshot";
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";

const NOW = "2026-05-04T10:00:00.000Z";

const userEditedHr = () => [
  { zone: 1, name: "Recovery", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 },
  { zone: 3, name: "Tempo", minBpm: 146, maxBpm: 160 },
  { zone: 4, name: "Threshold", minBpm: 161, maxBpm: 170 },
  { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 187 },
];

const v9MigratedProfile = (): Profile =>
  ({
    id: "00000000-0000-0000-0000-000000000099",
    name: "Pablo (v9-migrated)",
    bodyWeight: 83,
    sportZones: {
      cycling: {
        thresholds: { ftp: 200 },
        // method "user" — flipped by the v9 migration because zones differ
        // from the all-zero seed. Rolling back to v8 reconcile, this MUST
        // route the same way as if method were still "custom" + populated.
        heartRateZones: { method: "user", zones: userEditedHr() },
      },
    },
    linkedAccounts: [
      {
        source: "train2go",
        externalUserId: "99999",
        externalUserName: "Pablo",
        linkedAt: NOW,
        syncZones: true,
        // lastSyncedZonesSnapshot present (v9 schema). The v8 reconcile
        // doesn't read it; Zod's .optional() accepts the absent path on
        // older builds. This field's presence MUST NOT crash v8 reconcile.
        lastSyncedZonesSnapshot: {
          syncedAt: NOW,
          cyclingHr: userEditedHr(),
          runningHr: [],
          swimmingHr: [],
          cyclingPower: [],
          runningPace: [],
          swimmingPace: [],
        },
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  }) as Profile;

describe("v9 rollback regression — frozen v8 reconcile against v9 profile", () => {
  it("should NOT silently overwrite user-edited HR zones when method = 'user' (1.6.5 — load-bearing)", () => {
    // Arrange — v9-migrated profile has method = "user" + edited HR.
    // T2G's payload provides bands that differ from the user's edits.
    const profile = v9MigratedProfile();
    const incoming = new Map<FieldKey, number>([
      ["cycling.heartRateZones.z1.minBpm", 107],
      ["cycling.heartRateZones.z1.maxBpm", 133],
      ["cycling.heartRateZones.z2.minBpm", 134],
      ["cycling.heartRateZones.z2.maxBpm", 147],
    ]);

    // Act — run the FROZEN v8 reconcile (snapshot of commit prior to PR 1).
    const result = v8Reconcile(profile, incoming, readField, writeField);

    // Assert — v8 routes ALL 4 entries to per-band conflicts (zones
    // length === 5, not empty; method opaque to v8). NO silent
    // overwrite. The user's edited values stay byte-identical.
    expect(result.applied).toEqual<WrittenField[]>([]);
    expect(result.conflicts).toEqual<ConflictItem[]>([
      {
        field: "cycling.heartRateZones.z1.minBpm",
        current: 100,
        incoming: 107,
      },
      {
        field: "cycling.heartRateZones.z1.maxBpm",
        current: 130,
        incoming: 133,
      },
      {
        field: "cycling.heartRateZones.z2.minBpm",
        current: 131,
        incoming: 134,
      },
      {
        field: "cycling.heartRateZones.z2.maxBpm",
        current: 145,
        incoming: 147,
      },
    ]);
    // Persisted profile zones unchanged.
    expect(result.profile.sportZones.cycling?.heartRateZones?.zones).toEqual(
      userEditedHr()
    );
  });

  it("should silently fill an empty sport-kind table on v9 profile (sanity check — v8 path still works)", () => {
    // Arrange — v9-migrated profile with running.heartRateZones absent.
    // Same v8 behavior as today: empty table → silent-fill.
    const profile = v9MigratedProfile();
    const incoming = new Map<FieldKey, number>([
      ["running.heartRateZones.z1.minBpm", 107],
      ["running.heartRateZones.z1.maxBpm", 133],
    ]);

    // Act
    const result = v8Reconcile(profile, incoming, readField, writeField);

    // Assert — both bands silent-filled (running.heartRateZones absent).
    expect(result.applied).toHaveLength(2);
    expect(result.conflicts).toEqual<ConflictItem[]>([]);
  });

  it("should not crash when the profile contains lastSyncedZonesSnapshot (v9 schema field is opaque to v8)", () => {
    // Arrange — verify the new optional field doesn't break old code.
    const profile = v9MigratedProfile();

    // Act — v8 reconcile reads from sportZones, never from linkedAccounts.
    // Snapshot's presence must not affect anything.
    const result = v8Reconcile(profile, new Map(), readField, writeField);

    // Assert — empty incoming → empty applied + conflicts. No crash.
    expect(result.applied).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(
      result.profile.linkedAccounts[0]?.lastSyncedZonesSnapshot
    ).toBeDefined();
  });
});
