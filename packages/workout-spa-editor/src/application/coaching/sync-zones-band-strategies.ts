/**
 * Per-strategy band-table reconcile helpers. Co-located with
 * `sync-zones-band-table-reconcile.ts` so the dispatcher stays under
 * the 80-line file cap.
 */
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { readField, writeField } from "./sync-zones-profile-fields";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export const setTableMethodTrainTwoGo = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind
): Profile => {
  const sportConfig = profile.sportZones[sport];
  if (!sportConfig) return profile;
  const tc = (sportConfig as Record<string, unknown>)[kind] as
    | { method?: string; zones?: unknown[] }
    | undefined;
  if (!tc) return profile;
  return {
    ...profile,
    sportZones: {
      ...profile.sportZones,
      [sport]: {
        ...sportConfig,
        [kind]: { ...tc, method: "train2go" },
      },
    },
  };
};

/**
 * Silent-replace a band-table; skip no-op writes (re-sync of unchanged
 * data) but always flip method to "train2go".
 */
export const silentReplaceTable = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  incoming: Map<FieldKey, number>
): { profile: Profile; applied: WrittenField[] } => {
  let next = profile;
  const applied: WrittenField[] = [];
  for (const [field, value] of incoming) {
    if (readField(next, field) === value) continue;
    next = writeField(next, field, value);
    applied.push({ field, value });
  }
  next = setTableMethodTrainTwoGo(next, sport, kind);
  return { profile: next, applied };
};

export const perBandConflicts = (
  profile: Profile,
  incoming: Map<FieldKey, number>
): ConflictItem[] => {
  const conflicts: ConflictItem[] = [];
  for (const [field, value] of incoming) {
    const current = readField(profile, field);
    if (current !== undefined && current !== value) {
      conflicts.push({ field, current, incoming: value });
    }
  }
  return conflicts;
};

/** Snapshot-aware conflict emission: only bands where user edited since last sync. */
export const snapshotEditedConflicts = (
  profile: Profile,
  incoming: Map<FieldKey, number>,
  snapshotByField: Map<FieldKey, number>
): ConflictItem[] => {
  const conflicts: ConflictItem[] = [];
  for (const [field, value] of incoming) {
    const current = readField(profile, field);
    const snap = snapshotByField.get(field);
    if (current !== undefined && current !== value && current !== snap) {
      conflicts.push({ field, current, incoming: value });
    }
  }
  return conflicts;
};
