/**
 * syncWithCloud — pull → export → merge → import → push orchestration.
 *
 * A pure application use case: pulls the remote snapshot, exports the
 * local one, merges them last-write-wins (`mergeSnapshots`), reconciles the
 * unclaimed default profile against the remote (`reconcileAutoProfile`),
 * imports the result locally, then pushes it back under optimistic
 * concurrency. When the remote holds several real profiles and the user has
 * not picked one, the attempt stops before importing or pushing and reports
 * `needsChoice`: nothing changes until the choice is stored in `meta`.
 * A stale-revision push (the remote moved between pull and push) triggers
 * a bounded re-pull / re-merge / retry. Depends only on
 * the `CloudSyncPort` and `SnapshotPort` — never on Drive or Dexie.
 */

import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { isAutoProfile } from "../profile/helpers/claim-profile";
import { exportSnapshot } from "./export-snapshot";
import { importReconciledSnapshot } from "./import-reconciled-snapshot";
import { mergeSnapshots } from "./merge-snapshots";
import {
  AUTO_PROFILE_CHOICE_KEY,
  type ProfileChoice,
  reconcileAutoProfile,
} from "./reconcile-auto-profile";

export type SyncWithCloudDeps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
  now?: () => Date;
  /** Max optimistic-concurrency retries on a moved remote revision. */
  maxRetries?: number;
};

export type SyncWithCloudResult =
  | { revision: string; needsChoice?: undefined }
  | { revision: null; needsChoice: ProfileChoice[] };

/** Last line of defence: nothing imported or pushed carries an auto profile. */
const assertNoAutoProfile = (snapshot: Snapshot): void => {
  const profiles = (snapshot.tables.profiles ?? []) as Array<{
    origin?: unknown;
  }>;
  if (profiles.some(isAutoProfile)) {
    throw new Error("invariant: an origin:auto profile reached cloud.push");
  }
};

const storedChoice = (local: Snapshot): string | null => {
  const rows = (local.tables.meta ?? []) as Array<Record<string, unknown>>;
  const value = rows.find((r) => r.key === AUTO_PROFILE_CHOICE_KEY)?.value;
  return typeof value === "string" ? value : null;
};

async function attempt(deps: SyncWithCloudDeps): Promise<SyncWithCloudResult> {
  const { cloud, snapshotPort, deviceId, now } = deps;
  const remote = await cloud.pull();
  const local = await exportSnapshot({ port: snapshotPort, deviceId, now });
  const merged: Snapshot = remote
    ? mergeSnapshots(local, remote.snapshot)
    : local;
  const reconciled = reconcileAutoProfile(
    merged,
    remote?.snapshot ?? null,
    snapshotPort.perProfileTables(),
    { choice: storedChoice(local), now }
  );
  if (reconciled.kind === "needsChoice")
    return { revision: null, needsChoice: reconciled.candidates };
  const { snapshot, deviceLocalRekey } = reconciled;
  assertNoAutoProfile(snapshot);
  await importReconciledSnapshot({
    port: snapshotPort,
    snapshot,
    deviceLocalRekey,
    now,
  });
  const revision = await cloud.push(snapshot, remote?.headRevisionId ?? null);
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
