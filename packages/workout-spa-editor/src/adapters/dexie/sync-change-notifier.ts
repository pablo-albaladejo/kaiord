/**
 * Tells the sync engine that a synced table changed, so it can push.
 *
 * A Dexie middleware sees every write to every table, which a hand-kept
 * list of tables cannot: that list watched 8 of the ~30 stores that ride
 * the snapshot, and edits to the rest (sessions, health data, coaching)
 * never reached the other device. Writes made by a sync or backup import
 * itself are marked silent, or every import would schedule the next push.
 */

import Dexie, { type DBCore, type Middleware } from "dexie";

type Listener = () => void;

const listeners = new Set<Listener>();
const silent = new WeakSet<object>();

/** Calls `listener` after each write to a synced table; returns the unsubscribe. */
export function onSyncedTableChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Inside a transaction scope: its writes are an import, not a user change. */
export function markImportTransaction(): void {
  const native = Dexie.currentTransaction?.idbtrans;
  if (native) silent.add(native);
}

const notifier = (
  isWatched: (table: string) => boolean
): Middleware<DBCore> => ({
  stack: "dbcore",
  name: "sync-change-notifier",
  create: (down) => ({
    ...down,
    table: (name) => {
      const table = down.table(name);
      if (!isWatched(name)) return table;
      return {
        ...table,
        mutate: async (req) => {
          const res = await table.mutate(req);
          if (!silent.has(req.trans)) for (const l of listeners) l();
          return res;
        },
      };
    },
  }),
});

/** `deviceLocal`: the stores that never leave the device, minus tombstones. */
export function installSyncChangeNotifier(
  // Narrowed: a full `Dexie` parameter trips TS2589 on the subclass.
  db: { use: (middleware: Middleware<DBCore>) => unknown },
  deviceLocal: ReadonlySet<string>
): void {
  db.use(
    notifier((table) => table === "tombstones" || !deviceLocal.has(table))
  );
}
