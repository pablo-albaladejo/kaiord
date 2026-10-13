import type { SnapshotPort } from "../../ports/snapshot-port";
import type { KaiordDatabase } from "./dexie-database";

type DexieTxScope = (
  mode: "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<unknown>
) => Promise<unknown>;

/**
 * `db.tables` is the schema the database opened with, not a list kept here,
 * so a store added by a later version is emptied without touching this file.
 */
export function createDexieClearAllTables(
  db: KaiordDatabase
): SnapshotPort["clearAllTables"] {
  const scoped = db as unknown as { transaction: DexieTxScope };
  return async () => {
    await scoped.transaction("rw", db.tables, async () => {
      for (const table of db.tables) await table.clear();
    });
  };
}
