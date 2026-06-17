/**
 * Dexie SnapshotPort Adapter
 *
 * Implements whole-database dump/restore by enumerating `db.tables`, so
 * a table added in a future schema version is captured without changing
 * the snapshot use cases. The `tombstones` store is handled by the
 * dedicated tombstone methods, not by `exportTables`/`importTables`.
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { SnapshotTables, Tombstone } from "../../types/snapshot";
import type { KaiordDatabase } from "./dexie-database";

const TOMBSTONES = "tombstones";

// Narrow to a single explicit signature so tsc sidesteps Dexie's recursive
// transaction overloads (TS2589). Same pattern as dexie-persistence-adapter.
type DexieTxScope = (
  mode: "r" | "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<unknown>
) => Promise<unknown>;

export function createDexieSnapshotPort(db: KaiordDatabase): SnapshotPort {
  const dataTables = () => db.tables.filter((t) => t.name !== TOMBSTONES);
  // Call transaction as a method on the cast db so `this` stays bound to it.
  const scoped = db as unknown as { transaction: DexieTxScope };

  return {
    // One transaction over every table. The inner `importTables` /
    // `replaceTombstones` / read calls below open Dexie transactions on
    // subsets of this scope, which Dexie nests into (joins) this one — so
    // the whole export/import is a single atomic unit.
    transaction: <T>(mode: "r" | "rw", scope: () => Promise<T>): Promise<T> =>
      scoped.transaction(
        mode,
        db.tables,
        scope as () => Promise<unknown>
      ) as Promise<T>,

    schemaVersion: async () => db.verno,

    exportTables: async () => {
      const out: Record<string, unknown[]> = {};
      for (const table of dataTables()) {
        out[table.name] = await table.toArray();
      }
      return out;
    },

    importTables: async (tables: SnapshotTables) => {
      const scope = dataTables();
      await scoped.transaction("rw", scope, async () => {
        for (const table of scope) {
          await table.clear();
          const rows = tables[table.name];
          if (rows && rows.length > 0) await table.bulkPut([...rows]);
        }
      });
    },

    listTombstones: async () =>
      (await db.table(TOMBSTONES).toArray()) as Tombstone[],

    replaceTombstones: async (tombstones) => {
      await scoped.transaction("rw", [db.table(TOMBSTONES)], async () => {
        await db.table(TOMBSTONES).clear();
        if (tombstones.length > 0)
          await db.table(TOMBSTONES).bulkPut([...tombstones]);
      });
    },
  };
}
