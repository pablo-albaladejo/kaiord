/**
 * Profile-aware SnapshotPort operations for the Dexie adapter: the
 * per-profile table list (same predicate as the profile-delete cascade),
 * the device-local rewrite used when the default profile is re-keyed, and
 * the `meta` write that records the user's re-key target.
 */

import { DEVICE_LOCAL_REKEY_TABLES } from "../../application/sync/auto-profile-rekey-rules";
import type { SnapshotPort } from "../../ports/snapshot-port";
import type { SnapshotTables } from "../../types/snapshot";
import type { KaiordDatabase } from "./dexie-database";
import { isPerProfileTable } from "./is-per-profile-table";

type DexieTxScope = (
  mode: "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<unknown>
) => Promise<unknown>;

type ProfileOps = Pick<
  SnapshotPort,
  "perProfileTables" | "updateDeviceLocal" | "writeMeta"
>;

export function createDexieSnapshotProfileOps(db: KaiordDatabase): ProfileOps {
  const scoped = db as unknown as { transaction: DexieTxScope };
  const deviceLocal = () =>
    db.tables.filter((t) => DEVICE_LOCAL_REKEY_TABLES.includes(t.name));

  return {
    perProfileTables: () =>
      db.tables.filter(isPerProfileTable).map((t) => t.name),

    updateDeviceLocal: async (transform) => {
      const tables = deviceLocal();
      await scoped.transaction("rw", tables, async () => {
        const before: SnapshotTables = {};
        for (const table of tables) before[table.name] = await table.toArray();
        const after = transform(before);
        for (const table of tables) {
          await table.clear();
          const rows = after[table.name] ?? [];
          if (rows.length > 0) await table.bulkPut([...rows]);
        }
      });
    },

    writeMeta: async (key, value) => {
      await db.table("meta").put({ key, value });
    },
  };
}
