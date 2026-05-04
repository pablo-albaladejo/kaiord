/**
 * @frozen-snapshot-of src/application/coaching/sync-zones-helpers.ts@f954d405
 *
 * DO NOT EDIT — this is the v8-shipped reconcile, frozen for the v9
 * rollback regression test (zones-method-aware-reconcile §1.6.5).
 *
 * The test runs this snapshot against a v9-migrated profile to assert
 * that rollback (deploying the old JS bundle while the user's local
 * IndexedDB has already been migrated to v9) produces no silent data
 * loss.
 *
 * This file is deleted in PR 6 (archive of zones-method-aware-reconcile)
 * — the rollback risk window closes once all PRs are merged and the
 * commit prior to PR 1 (`f954d405`) is no longer the deployable
 * rollback target.
 *
 * ESLint exemption: this is a verbatim 80-line copy of the v8 reconcile;
 * the file's `max-lines` would otherwise reject the snapshot since the
 * helpers can't be extracted (they're frozen with the v8 contract).
 */
/* eslint-disable max-lines */

import type {
  ConflictItem,
  FieldKey,
  WrittenField,
  ZonesReconciliation,
} from "../types/coaching-zones";
import type { Profile } from "../types/profile";

type V8IncomingMap = Map<FieldKey, number>;

const V8_BAND_KEY_RE =
  /^(cycling|running|swimming)\.(heartRateZones|powerZones|paceZones)\.z[1-5]\.(minBpm|maxBpm|minPercent|maxPercent|minPace|maxPace)$/;

const v8TableSlotKey = (field: FieldKey): string | null => {
  const m = V8_BAND_KEY_RE.exec(field);
  return m ? `${m[1]}.${m[2]}` : null;
};

const v8IsTableEmpty = (
  profile: Profile,
  sport: "cycling" | "running" | "swimming",
  kind: "heartRateZones" | "powerZones" | "paceZones"
): boolean => {
  const sportConfig = profile.sportZones[sport];
  if (!sportConfig) return true;
  const config = (sportConfig as Record<string, unknown>)[kind] as
    | { zones?: unknown[] }
    | undefined;
  if (!config) return true;
  if (!Array.isArray(config.zones) || config.zones.length === 0) return true;
  return false;
};

const v8IsBandKeyInEmptyTable = (
  profile: Profile,
  field: FieldKey
): boolean => {
  const slot = v8TableSlotKey(field);
  if (!slot) return false;
  const [sport, kind] = slot.split(".") as [
    "cycling" | "running" | "swimming",
    "heartRateZones" | "powerZones" | "paceZones",
  ];
  return v8IsTableEmpty(profile, sport, kind);
};

/**
 * Frozen v8-shipped reconcile. Identical to
 * `sync-zones-helpers.ts:reconcile` at commit `f954d405`. The signature
 * takes a `writeField` adapter so the test can inject the post-PR-1
 * writeField (which is unchanged in PR 1 — the test verifies semantics
 * not internals).
 */
export const v8Reconcile = (
  profile: Profile,
  incoming: V8IncomingMap,
  readField: (p: Profile, f: FieldKey) => number | undefined,
  writeField: (p: Profile, f: FieldKey, v: number) => Profile
): { profile: Profile } & ZonesReconciliation => {
  const applied: WrittenField[] = [];
  const conflicts: ConflictItem[] = [];
  let next = profile;
  for (const [field, value] of incoming) {
    if (v8IsBandKeyInEmptyTable(profile, field)) {
      next = writeField(next, field, value);
      applied.push({ field, value });
      continue;
    }
    const current = readField(next, field);
    if (current === undefined) {
      next = writeField(next, field, value);
      applied.push({ field, value });
    } else if (current !== value) {
      conflicts.push({ field, current, incoming: value });
    }
  }
  return { profile: next, applied, conflicts };
};
