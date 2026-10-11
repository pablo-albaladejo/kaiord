/**
 * useSyncCycle — one pull-merge-push cycle and the state it reports
 * (status, last success, error, and a pending default-profile choice).
 * `chooseProfile` stores the user's pick through the SnapshotPort and runs
 * the cycle again, so the re-key goes through the same sync pipeline.
 */

import { useCallback, useState } from "react";

import {
  AUTO_PROFILE_CHOICE_KEY,
  type ProfileChoice,
} from "../application/sync/reconcile-auto-profile";
import { syncWithCloud } from "../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../ports/cloud-sync-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import type { SyncOutcome, SyncStatus } from "./sync-engine-types";

export type UseSyncCycleDeps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
};

export function useSyncCycle({
  cloud,
  snapshotPort,
  deviceId,
}: UseSyncCycleDeps) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileChoice, setProfileChoice] = useState<ProfileChoice[] | null>(
    null
  );

  const syncNow = useCallback(async (): Promise<SyncOutcome> => {
    setStatus("syncing");
    setError(null);
    try {
      const result = await syncWithCloud({ cloud, snapshotPort, deviceId });
      setProfileChoice(result.needsChoice ?? null);
      setStatus("idle");
      if (result.needsChoice) return "needsChoice";
      setLastSyncedAt(new Date().toISOString());
      return "synced";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sync failed");
      setStatus("error");
      return "failed";
    }
  }, [cloud, snapshotPort, deviceId]);

  const chooseProfile = useCallback(
    async (profileId: string): Promise<SyncOutcome> => {
      await snapshotPort.writeMeta(AUTO_PROFILE_CHOICE_KEY, profileId);
      return syncNow();
    },
    [snapshotPort, syncNow]
  );

  return {
    status,
    lastSyncedAt,
    error,
    profileChoice,
    syncNow,
    chooseProfile,
  };
}
