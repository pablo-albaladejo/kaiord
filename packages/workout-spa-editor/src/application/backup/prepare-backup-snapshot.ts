/**
 * The snapshot a backup import writes: this device's snapshot merged with the
 * file's (last write wins, tombstones on both sides suppress older rows), so
 * nothing local is wiped. The file only contributes the tables the backup
 * policy allows, rewritten by it, so a tampered file cannot bring back an API
 * key, a cursor or a connection. `meta` stays this device's, except that the
 * file's active profile is adopted when this device has no valid one. The
 * unclaimed default profile is reconciled against the file's profiles exactly
 * as a Drive sync reconciles it against the remote. Nutrition rows of a
 * profile that does not exist after the import (deleted after the backup) are
 * left out rather than restored as orphans. Pure.
 */

import type { KaiordBackup } from "../../types/backup";
import type { Snapshot } from "../../types/snapshot";
import { isAutoProfile } from "../profile/helpers/claim-profile";
import { mergeSnapshots } from "../sync/merge-snapshots";
import {
  reconcileAutoProfile,
  type ReconcileOptions,
  type ReconcileResult,
} from "../sync/reconcile-auto-profile";
import { applyBackupTablePolicy } from "./backup-table-policy";
import { restoreProviderKeys } from "./restore-provider-keys";

type Row = Record<string, unknown>;

const ACTIVE = "activeProfileId";
const NUTRITION = ["intakeEntries", "intakePresets", "energyTargets"];

const rowsOf = (s: Snapshot, table: string): Row[] =>
  (s.tables[table] ?? []) as Row[];

export const backupSnapshot = (backup: KaiordBackup): Snapshot => ({
  manifest: backup.manifest,
  tables: applyBackupTablePolicy(backup.tables),
  tombstones: backup.tombstones,
});

const keepLocalMeta = (merged: Snapshot, local: Snapshot): Snapshot => ({
  ...merged,
  manifest: local.manifest,
  tables: { ...merged.tables, meta: rowsOf(local, "meta") },
});

// The file calls every profile it carries real: a default profile this
// device exported and now re-imports is claimed, not re-keyed onto itself.
const claimFileProfiles = (merged: Snapshot, file: Snapshot): Snapshot => {
  const real = new Set(rowsOf(file, "profiles").map((p) => p.id));
  const profiles = rowsOf(merged, "profiles").map((p) =>
    real.has(p.id) && isAutoProfile(p) ? { ...p, origin: "local" } : p
  );
  return { ...merged, tables: { ...merged.tables, profiles } };
};

const adoptActiveProfile = (snapshot: Snapshot, file: Snapshot): Snapshot => {
  const ids = new Set(rowsOf(snapshot, "profiles").map((p) => p.id));
  const meta = rowsOf(snapshot, "meta");
  if (ids.has(meta.find((r) => r.key === ACTIVE)?.value)) return snapshot;
  const theirs = rowsOf(file, "meta").find((r) => r.key === ACTIVE)?.value;
  if (!ids.has(theirs)) return snapshot;
  const next = [
    ...meta.filter((r) => r.key !== ACTIVE),
    { key: ACTIVE, value: theirs },
  ];
  return { ...snapshot, tables: { ...snapshot.tables, meta: next } };
};

const dropOrphanNutrition = (snapshot: Snapshot): Snapshot => {
  const ids = new Set(rowsOf(snapshot, "profiles").map((p) => p.id));
  const tables = { ...snapshot.tables };
  for (const name of NUTRITION)
    if (tables[name])
      tables[name] = rowsOf(snapshot, name).filter((r) => ids.has(r.profileId));
  return { ...snapshot, tables };
};

export function prepareBackupSnapshot(
  local: Snapshot,
  backup: KaiordBackup,
  perProfileTables: ReadonlyArray<string>,
  options: ReconcileOptions
): ReconcileResult {
  const file = backupSnapshot(backup);
  const merged = claimFileProfiles(
    restoreProviderKeys(
      keepLocalMeta(mergeSnapshots(local, file), local),
      local
    ),
    file
  );
  const result =
    rowsOf(file, "profiles").length === 0
      ? ({ kind: "ready", snapshot: merged, deviceLocalRekey: null } as const)
      : reconcileAutoProfile(merged, file, perProfileTables, options);
  if (result.kind === "needsChoice") return result;
  const snapshot = dropOrphanNutrition(result.snapshot);
  return { ...result, snapshot: adoptActiveProfile(snapshot, file) };
}
