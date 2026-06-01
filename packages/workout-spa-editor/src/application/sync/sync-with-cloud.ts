/**
 * syncWithCloud — pull → export → merge → import → push orchestration.
 *
 * A pure application use case: pulls the remote snapshot, exports the
 * local one, merges them last-write-wins (`mergeSnapshots`), imports the
 * merged result locally, then pushes it back under optimistic
 * concurrency. A stale-revision push (the remote moved between pull and
 * push) triggers a bounded re-pull / re-merge / retry. Depends only on
 * the `CloudSyncPort` and `SnapshotPort` — never on Drive or Dexie.
 */

import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { exportSnapshot } from "./export-snapshot";
import { importSnapshot } from "./import-snapshot";
import { mergeSnapshots } from "./merge-snapshots";

export type SyncWithCloudDeps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
  now?: () => Date;
  /** Max optimistic-concurrency retries on a moved remote revision. */
  maxRetries?: number;
};

export type SyncWithCloudResult = { revision: string };

async function attempt(deps: SyncWithCloudDeps): Promise<SyncWithCloudResult> {
  const { cloud, snapshotPort, deviceId, now } = deps;
  const remote = await cloud.pull();
  const local = await exportSnapshot({ port: snapshotPort, deviceId, now });
  const merged: Snapshot = remote
    ? mergeSnapshots(local, remote.snapshot)
    : local;
  await importSnapshot({ port: snapshotPort, snapshot: merged, now });
  const revision = await cloud.push(merged, remote?.headRevisionId ?? null);
  return { revision };
}

export async function syncWithCloud(
  deps: SyncWithCloudDeps
): Promise<SyncWithCloudResult> {
  const maxRetries = deps.maxRetries ?? 3;
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i += 1) {
    try {
      return await attempt(deps);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
