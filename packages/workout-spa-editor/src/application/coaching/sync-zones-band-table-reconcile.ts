/**
 * `reconcileBandTable` — given a classified state + incoming bands,
 * routes to the correct strategy. Strategy implementations live in
 * `sync-zones-band-strategies.ts`.
 */
import type {
  ConflictItem,
  FieldKey,
  WrittenField,
} from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import {
  perBandConflicts,
  silentReplaceTable,
  snapshotEditedConflicts,
} from "./sync-zones-band-strategies";
import type {
  Sport,
  ZoneKind,
  ZoneTableState,
} from "./zone-table-classifier-types";

export type BandTableReconcileResult = {
  profile: Profile;
  applied: WrittenField[];
  conflicts: ConflictItem[];
};

export const reconcileBandTable = (
  profile: Profile,
  state: ZoneTableState,
  sport: Sport,
  kind: ZoneKind,
  tableIncoming: Map<FieldKey, number>,
  snapshotByField: Map<FieldKey, number> | undefined
): BandTableReconcileResult => {
  if (
    state === "empty" ||
    state === "default-template" ||
    state === "method-derived" ||
    state === "train2go-synced-clean"
  ) {
    const r = silentReplaceTable(profile, sport, kind, tableIncoming);
    return { profile: r.profile, applied: r.applied, conflicts: [] };
  }
  const conflicts =
    state === "train2go-synced-edited" && snapshotByField
      ? snapshotEditedConflicts(profile, tableIncoming, snapshotByField)
      : perBandConflicts(profile, tableIncoming);
  return { profile, applied: [], conflicts };
};
