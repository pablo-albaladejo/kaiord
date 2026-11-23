/**
 * The stores that never leave this device: not in the Drive sync snapshot,
 * not in a backup file, never written by either on import.
 *
 * - `connections`: bridge linkage and credentials of this device.
 * - `traces`: the athlete's Traces, read and exported in Settings, Privacy.
 * - `usageEvents`: the usage log, one row per run of the assistant, read by
 *   the Usage tab, which shows this device's usage. A per-run row describes
 *   what the athlete did with the assistant as a Trace does, so it stays
 *   with the Traces.
 *
 * A device on an earlier build may still hold these in Drive or in a file:
 * `withoutDeviceLocal` drops them, and their tombstones, from what arrives,
 * so they are neither imported nor pushed back.
 */
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { Snapshot } from "../../types/snapshot";

export const DEVICE_LOCAL_TABLES = [
  "connections",
  "traces",
  "usageEvents",
] as const;

const LOCAL: ReadonlySet<string> = new Set(DEVICE_LOCAL_TABLES);

export const isDeviceLocalTable = (table: string): boolean => LOCAL.has(table);

export const withoutDeviceLocal = (snapshot: Snapshot): Snapshot => ({
  ...snapshot,
  tables: Object.fromEntries(
    Object.entries(snapshot.tables).filter(([name]) => !LOCAL.has(name))
  ),
  tombstones: snapshot.tombstones.filter((t) => !LOCAL.has(t.table)),
});

/** The cloud as the sync sees it: device-local stores neither come nor go. */
export const deviceLocalStaysHome = (cloud: CloudSyncPort): CloudSyncPort => ({
  ...cloud,
  pull: async () => {
    const remote = await cloud.pull();
    return (
      remote && { ...remote, snapshot: withoutDeviceLocal(remote.snapshot) }
    );
  },
  push: (snapshot, expectedRevision) =>
    cloud.push(withoutDeviceLocal(snapshot), expectedRevision),
});
