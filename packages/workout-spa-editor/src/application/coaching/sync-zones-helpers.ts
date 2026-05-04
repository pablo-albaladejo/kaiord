/**
 * `reconcile` — splits an `IncomingMap` against the persisted profile
 * into silent fills (current value absent) vs. conflicts (current value
 * differs from incoming). No-op when current === incoming. Returns a
 * fresh profile with silent fills already applied; conflicts are NOT
 * written here — the caller (`syncZones`) returns them to the UI for
 * per-row confirmation.
 *
 * For band-level FieldKeys (`<sport>.<kind>.zN.<bound>`), reconcile
 * operates at TABLE granularity for empty-detection: when the
 * persisted sport-kind table is empty (zones array missing OR
 * length === 0), ALL bands of that table are silent-fills regardless
 * of incoming values. Once the table has data, per-band comparisons
 * apply (conflicts on differing values, no-op on matching).
 */
import type { ZonesReconciliation } from "../../types/coaching-zones";
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import type { IncomingMap } from "./sync-zones-payload-mapper";
import { readField, writeField } from "./sync-zones-profile-fields";

const BAND_KEY_RE =
  /^(cycling|running|swimming)\.(heartRateZones|powerZones|paceZones)\.z[1-5]\.(minBpm|maxBpm|minPercent|maxPercent|minPace|maxPace)$/;

const tableSlotKey = (field: FieldKey): string | null => {
  const m = BAND_KEY_RE.exec(field);
  return m ? `${m[1]}.${m[2]}` : null;
};

const isTableEmpty = (
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

const isBandKeyInEmptyTable = (
  profile: Profile,
  field: FieldKey
): boolean => {
  const slot = tableSlotKey(field);
  if (!slot) return false;
  const [sport, kind] = slot.split(".") as [
    "cycling" | "running" | "swimming",
    "heartRateZones" | "powerZones" | "paceZones",
  ];
  return isTableEmpty(profile, sport, kind);
};

export const reconcile = (
  profile: Profile,
  incoming: IncomingMap
): { profile: Profile } & ZonesReconciliation => {
  const applied: WrittenField[] = [];
  const conflicts: ConflictItem[] = [];
  let next = profile;
  for (const [field, value] of incoming) {
    // For band-level keys, "empty table" is silent-fill regardless of
    // any seeded zero defaults that writeField may have introduced.
    // Snapshot the empty state against the ORIGINAL profile (before
    // any writes from this reconcile pass) so the first band-write
    // doesn't flip the table's empty-status mid-pass.
    if (isBandKeyInEmptyTable(profile, field)) {
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
