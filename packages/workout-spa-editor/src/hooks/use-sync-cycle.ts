/**
 * useSyncCycle — one pull-merge-push cycle and the state it reports
 * (status, last success, error, and a pending default-profile choice).
 * `chooseProfile` stores the user's pick through the SnapshotPort and runs
 * the cycle again, so the re-key goes through the same sync pipeline.
 */

import { useCallback, useRef, useState } from "react";

import {
  AUTO_PROFILE_CHOICE_KEY,
  type ProfileChoice,
} from "../application/sync/reconcile-auto-profile";
import { syncWithCloud } from "../application/sync/sync-with-cloud";
import type { CloudSyncPort } from "../ports/cloud-sync-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import { isCloudAuthRequired } from "../types/cloud-auth-required-error";
import type { SyncOutcome, SyncStatus } from "./sync-engine-types";

export type UseSyncCycleDeps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
  afterImport?: () => Promise<void>;
};

const errorText = (cause: unknown): string =>
  cause instanceof Error ? cause.message : "Sync failed";

export function useSyncCycle(deps: UseSyncCycleDeps) {
  const { cloud, snapshotPort, deviceId, afterImport } = deps;
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileChoice, setProfileChoice] = useState<ProfileChoice[] | null>(
    null
  );

  const running = useRef<Promise<SyncOutcome> | null>(null);

  const runCycle = useCallback(async (): Promise<SyncOutcome> => {
    setStatus("syncing");
    setError(null);
    try {
      const result = await syncWithCloud({
        cloud,
        snapshotPort,
        deviceId,
        afterImport,
      });
      setProfileChoice(result.needsChoice ?? null);
      setStatus("idle");
      if (result.needsChoice) return "needsChoice";
      setLastSyncedAt(new Date().toISOString());
      return "synced";
    } catch (cause) {
      const needsAuth = isCloudAuthRequired(cause);
      setError(needsAuth ? null : errorText(cause));
      setStatus(needsAuth ? "needsAuth" : "error");
      return needsAuth ? "needsAuth" : "failed";
    }
  }, [cloud, snapshotPort, deviceId, afterImport]);

  const syncNow = useCallback((): Promise<SyncOutcome> => {
    const cycle = runCycle();
    running.current = cycle;
    void cycle.finally(() => {
      if (running.current === cycle) running.current = null;
    });
    return cycle;
  }, [runCycle]);

  /** Resolves once no cycle is running, waiting for any that starts meanwhile. */
  const settled = useCallback(async (): Promise<void> => {
    while (running.current !== null) await running.current;
  }, []);

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
    settled,
  };
}
