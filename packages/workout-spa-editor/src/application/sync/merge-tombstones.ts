/**
 * Snapshot merge helpers — tombstone union and suppression.
 *
 * Pure helpers used by `mergeSnapshots`: union two tombstone lists
 * keeping the newest `deletedAt` per `[table+id]`, and decide whether a
 * surviving record is suppressed by a newer tombstone. No I/O.
 */

import type { Tombstone } from "../../types/snapshot";

const key = (t: { table: string; id: string }) => `${t.table} ${t.id}`;

/** Union tombstones, keeping the newest `deletedAt` per `[table+id]`. */
export function unionTombstones(
  a: ReadonlyArray<Tombstone>,
  b: ReadonlyArray<Tombstone>
): Tombstone[] {
  const byKey = new Map<string, Tombstone>();
  for (const t of [...a, ...b]) {
    const existing = byKey.get(key(t));
    if (!existing || Date.parse(t.deletedAt) > Date.parse(existing.deletedAt)) {
      byKey.set(key(t), t);
    }
  }
  return [...byKey.values()];
}

/** Index tombstones by `[table+id]` → `deletedAt` epoch ms. */
export function tombstoneClocks(
  tombstones: ReadonlyArray<Tombstone>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of tombstones) {
    const ms = Date.parse(t.deletedAt);
    out.set(key(t), Number.isNaN(ms) ? 0 : ms);
  }
  return out;
}

/** Compose a tombstone-clock lookup key for a record in a table. */
export const tombstoneKey = (table: string, id: string) => `${table} ${id}`;
