/**
 * In-Memory SnapshotPort
 *
 * Test fake mirroring the Dexie `SnapshotPort` adapter over plain
 * objects, so the `exportSnapshot` / `importSnapshot` use cases can be
 * exercised without IndexedDB.
 */

import type { SnapshotPort } from "../ports/snapshot-port";
import type { SnapshotTables, Tombstone } from "../types/snapshot";

export type InMemorySnapshotState = {
  schemaVersion: number;
  tables: Record<string, unknown[]>;
  tombstones: Tombstone[];
};

export function createInMemorySnapshotPort(
  state: InMemorySnapshotState
): SnapshotPort {
  return {
    // No real transactions to model in memory — run the scope directly.
    transaction: <T>(_mode: "r" | "rw", scope: () => Promise<T>) => scope(),

    schemaVersion: async () => state.schemaVersion,

    exportTables: async () => {
      const out: Record<string, unknown[]> = {};
      for (const [name, rows] of Object.entries(state.tables)) {
        out[name] = [...rows];
      }
      return out;
    },

    importTables: async (tables: SnapshotTables) => {
      for (const name of Object.keys(state.tables)) state.tables[name] = [];
      for (const [name, rows] of Object.entries(tables)) {
        state.tables[name] = [...rows];
      }
    },

    listTombstones: async () => [...state.tombstones],

    replaceTombstones: async (tombstones) => {
      state.tombstones = [...tombstones];
    },
  };
}
