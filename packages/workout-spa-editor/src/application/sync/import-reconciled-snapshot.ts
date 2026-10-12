/**
 * Imports a reconciled snapshot and, when the default profile was re-keyed,
 * moves its device-local rows (`connections`) onto the target in
 * the SAME read-write transaction: a failure after either step rolls both
 * back, so the database never holds rows re-keyed in one place only.
 * Returns the snapshot to push: `snapshot` with any delete this device made
 * since its export applied (`suppressLiveDeletes`).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot, SnapshotTables, Tombstone } from "../../types/snapshot";
import { DEVICE_LOCAL_REKEY_TABLES } from "./auto-profile-rekey-rules";
import { importSnapshot } from "./import-snapshot";
import { type ProfileRekey, rekeyTableRows } from "./rekey-profile-rows";
import { suppressLiveDeletes } from "./suppress-live-deletes";

export type ImportReconciledDeps = {
  port: SnapshotPort;
  snapshot: Snapshot;
  deviceLocalRekey: ProfileRekey | null;
  exported?: SnapshotTables;
  now?: () => Date;
};

export const rekeyDeviceLocal =
  (rekey: ProfileRekey) =>
  (tables: SnapshotTables): SnapshotTables =>
    Object.fromEntries(
      DEVICE_LOCAL_REKEY_TABLES.map((name) => [
        name,
        rekeyTableRows(name, tables[name] ?? [], rekey),
      ])
    );

export async function importReconciledSnapshot({
  port,
  snapshot,
  deviceLocalRekey,
  exported,
  now,
}: ImportReconciledDeps): Promise<Snapshot> {
  let live: ReadonlyArray<Tombstone> = [];
  await port.transaction("rw", async () => {
    live = await importSnapshot({ port, snapshot, exported, now });
    if (deviceLocalRekey)
      await port.updateDeviceLocal(rekeyDeviceLocal(deviceLocalRekey));
  });
  return suppressLiveDeletes(snapshot, live, port.perProfileTables());
}
