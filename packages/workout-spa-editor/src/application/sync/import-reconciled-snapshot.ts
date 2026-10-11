/**
 * Imports a reconciled snapshot and, when the default profile was re-keyed,
 * moves its device-local rows (`connections`, nutrition) onto the target in
 * the SAME read-write transaction: a failure after either step rolls both
 * back, so the database never holds rows re-keyed in one place only.
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot, SnapshotTables } from "../../types/snapshot";
import { DEVICE_LOCAL_REKEY_TABLES } from "./auto-profile-rekey-rules";
import { importSnapshot } from "./import-snapshot";
import { type ProfileRekey, rekeyTableRows } from "./rekey-profile-rows";

export type ImportReconciledDeps = {
  port: SnapshotPort;
  snapshot: Snapshot;
  deviceLocalRekey: ProfileRekey | null;
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
  now,
}: ImportReconciledDeps): Promise<void> {
  await port.transaction("rw", async () => {
    await importSnapshot({ port, snapshot, now });
    if (deviceLocalRekey)
      await port.updateDeviceLocal(rekeyDeviceLocal(deviceLocalRekey));
  });
}
