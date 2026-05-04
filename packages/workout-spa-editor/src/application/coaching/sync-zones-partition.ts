/**
 * `partitionIncoming` + `reconcileThresholds` — co-located helpers for
 * `sync-zones-helpers.ts:reconcile` so the parent file stays under the
 * 80-line cap.
 */
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import type { IncomingMap } from "./sync-zones-payload-mapper";
import { readField, writeField } from "./sync-zones-profile-fields";
import { tableKeyOfField } from "./sync-zones-snapshot";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

export type TableGroups = Map<`${Sport}.${ZoneKind}`, Map<FieldKey, number>>;

export const partitionIncoming = (
  incoming: IncomingMap
): { thresholds: IncomingMap; tables: TableGroups } => {
  const thresholds: IncomingMap = new Map();
  const tables: TableGroups = new Map();
  for (const [field, value] of incoming) {
    const key = tableKeyOfField(field);
    if (!key) {
      thresholds.set(field, value);
      continue;
    }
    const tk = `${key.sport}.${key.kind}` as const;
    let entry = tables.get(tk);
    if (!entry) {
      entry = new Map();
      tables.set(tk, entry);
    }
    entry.set(field, value);
  }
  return { thresholds, tables };
};

export const reconcileThresholds = (
  profile: Profile,
  thresholds: IncomingMap
): { profile: Profile; applied: WrittenField[]; conflicts: ConflictItem[] } => {
  const applied: WrittenField[] = [];
  const conflicts: ConflictItem[] = [];
  let next = profile;
  for (const [field, value] of thresholds) {
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
