/**
 * exportSnapshot use case
 *
 * Produces a full-database `Snapshot` (manifest + per-table rows +
 * tombstones) through `SnapshotPort`. Pure: depends only on the port and
 * injected clock/identity, never on `dexie-database` (guard
 * R-AppDexieImport).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot } from "../../types/snapshot";

export type ExportSnapshotDeps = {
  port: SnapshotPort;
  deviceId: string;
  /** Injected clock so the manifest timestamp is deterministic in tests. */
  now?: () => Date;
};

export async function exportSnapshot({
  port,
  deviceId,
  now = () => new Date(),
}: ExportSnapshotDeps): Promise<Snapshot> {
  // Single read transaction so the schema version, table rows, and
  // tombstones are a consistent point-in-time snapshot (a concurrent
  // local write cannot interleave between the reads).
  const [schemaVersion, tables, tombstones] = await port.transaction("r", () =>
    Promise.all([
      port.schemaVersion(),
      port.exportTables(),
      port.listTombstones(),
    ])
  );
  return {
    manifest: {
      schemaVersion,
      deviceId,
      exportedAt: now().toISOString(),
      encrypted: false,
    },
    tables,
    tombstones,
  };
}
