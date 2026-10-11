/**
 * Drops the per-profile rows of a profile that was explicitly deleted.
 *
 * The profile delete cascades over its rows without per-row tombstones, and
 * a remote snapshot that still holds them would union them back. The
 * `profiles` tombstone is the only proof the profile is gone: a profile
 * that has a tombstone and no live row in the snapshot (the merge already
 * let a newer re-creation win) loses its rows in every per-profile table. A
 * row whose profile is merely absent, not tombstoned, is kept: its profile
 * may simply not have arrived yet. Pure.
 */

import type { Snapshot } from "../../types/snapshot";

type Row = Record<string, unknown>;

export function dropDeletedProfileRows(
  snapshot: Snapshot,
  perProfileTables: ReadonlyArray<string>
): Snapshot {
  const live = new Set(
    ((snapshot.tables.profiles ?? []) as Row[]).map((p) => p.id)
  );
  const deleted = new Set(
    snapshot.tombstones
      .filter((t) => t.table === "profiles" && !live.has(t.id))
      .map((t) => t.id)
  );
  if (deleted.size === 0) return snapshot;
  const tables = { ...snapshot.tables };
  for (const name of perProfileTables) {
    const rows = tables[name] as Row[] | undefined;
    if (rows)
      tables[name] = rows.filter(
        (row) => !deleted.has(row.profileId as string)
      );
  }
  return { ...snapshot, tables };
}
