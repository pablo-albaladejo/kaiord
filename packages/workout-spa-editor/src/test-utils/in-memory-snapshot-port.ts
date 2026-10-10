/**
 * In-Memory SnapshotPort
 *
 * Test fake mirroring the Dexie `SnapshotPort` adapter over plain
 * objects, so the `exportSnapshot` / `importSnapshot` use cases can be
 * exercised without IndexedDB.
 */

import {
  AUTO_PROFILE_REKEY_RULES,
  DEVICE_LOCAL_REKEY_TABLES,
} from "../application/sync/auto-profile-rekey-rules";
import type { SnapshotPort } from "../ports/snapshot-port";
import type { SnapshotTables, Tombstone } from "../types/snapshot";

export type InMemorySnapshotState = {
  schemaVersion: number;
  tables: Record<string, unknown[]>;
  tombstones: Tombstone[];
  /** Per-profile table names; defaults to every re-key rule table. */
  perProfileTables?: string[];
  /** Device-local rows, kept outside `tables` like the Dexie adapter does. */
  deviceLocal?: Record<string, unknown[]>;
};

const DEFAULT_PER_PROFILE = Object.keys(AUTO_PROFILE_REKEY_RULES).filter(
  (t) => !DEVICE_LOCAL_REKEY_TABLES.includes(t)
);

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

    // Mirrors the Dexie adapter: natural-key tables merge with live rows.
    importTables: async (tables: SnapshotTables, { liveMerge }) => {
      const live = { ...state.tables };
      for (const name of new Set([
        ...Object.keys(live),
        ...Object.keys(tables),
      ])) {
        const rows = tables[name] ?? [];
        const merge = liveMerge(name);
        state.tables[name] = merge ? merge(live[name] ?? [], rows) : [...rows];
      }
    },

    listTombstones: async () => [...state.tombstones],

    replaceTombstones: async (tombstones) => {
      state.tombstones = [...tombstones];
    },

    perProfileTables: () => [
      ...(state.perProfileTables ?? DEFAULT_PER_PROFILE),
    ],

    updateDeviceLocal: async (transform) => {
      const next = transform({ ...(state.deviceLocal ?? {}) });
      state.deviceLocal = Object.fromEntries(
        Object.entries(next).map(([name, rows]) => [name, [...rows]])
      );
    },

    writeMeta: async (key, value) => {
      const meta = (state.tables.meta ?? []) as Array<{ key: string }>;
      state.tables.meta = [
        ...meta.filter((r) => r.key !== key),
        { key, value },
      ];
    },
  };
}
