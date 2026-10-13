import type { SnapshotPort } from "../../ports/snapshot-port";

export type WipeAllDataDeps = {
  snapshotPort: SnapshotPort;
  /** Turns cloud sync off on this device and drops any pending push. */
  stopSync: () => void;
  /** Removes what this app keeps outside the database on this device. */
  clearDeviceStorage: () => void;
};

/**
 * Deletes everything this browser holds, and nothing anywhere else.
 *
 * Sync stops first, so no cycle runs over a half-emptied database. The
 * tables are emptied without tombstones, so a later sync from this browser
 * merges the Drive copy back in instead of deleting it. Device storage is
 * cleared last: if the database wipe throws, the device keeps its settings
 * and the caller can report the failure on a page that still works.
 */
export async function wipeAllData(deps: WipeAllDataDeps): Promise<void> {
  deps.stopSync();
  await deps.snapshotPort.clearAllTables();
  deps.clearDeviceStorage();
}
