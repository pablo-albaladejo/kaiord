/**
 * Wraps a `SnapshotPort` so `write` runs once, right after the first
 * transaction that read `exportTables` completes: inside a sync, between its
 * export read and its import. Keyed on the export itself, not on the first
 * read-write transaction, so a read-write step added before the export can
 * neither trigger the write too early nor let a test pass without the race.
 */

import type { SnapshotPort } from "../ports/snapshot-port";

export const writeAfterExport = (
  port: SnapshotPort,
  write: () => Promise<void>
): SnapshotPort => {
  let exported = false;
  let pending: (() => Promise<void>) | null = write;
  return {
    ...port,
    exportTables: () => {
      exported = true;
      return port.exportTables();
    },
    transaction: async (mode, scope) => {
      const result = await port.transaction(mode, scope);
      if (exported && pending) {
        const run = pending;
        pending = null;
        await run();
      }
      return result;
    },
  };
};
