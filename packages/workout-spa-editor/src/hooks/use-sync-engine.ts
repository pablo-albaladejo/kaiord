/**
 * useSyncEngine — runtime sync-state machine for cross-device cloud sync.
 *
 * Owns ephemeral sync status (idle/syncing/error + lastSyncedAt) in React
 * state and drives the pure `syncWithCloud` use case through injected
 * `CloudSyncPort` + `SnapshotPort`. It never reads or writes Dexie
 * directly — all I/O flows through the ports — and never lives in a
 * Zustand store, so guards R-DexieImport / R-PersistStateImport /
 * R-AppDexieImport are preserved. Auto-push is debounced so a burst of
 * edits collapses to a single Drive write; failures are non-fatal and
 * surface as `status === "error"`, leaving the local database usable.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { CloudSyncPort } from "../ports/cloud-sync-port";
import type { SnapshotPort } from "../ports/snapshot-port";
import { PUSH_DEBOUNCE_MS, type SyncEngine } from "./sync-engine-types";
import { useSyncCycle } from "./use-sync-cycle";

export type UseSyncEngineDeps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
};

export function useSyncEngine(deps: UseSyncEngineDeps): SyncEngine {
  const { cloud } = deps;
  const cycle = useSyncCycle(deps);
  const { syncNow } = cycle;
  const [connected, setConnected] = useState<boolean>(() =>
    cloud.isAuthenticated()
  );
  // Mirror `connected` in a ref so debounced callbacks read the live value
  // rather than the value captured at the render that scheduled them.
  const connectedRef = useRef<boolean>(connected);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPush = useCallback(() => {
    if (!connectedRef.current) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void syncNow();
    }, PUSH_DEBOUNCE_MS);
  }, [syncNow]);

  const connect = useCallback(async () => {
    await cloud.authenticate();
    connectedRef.current = true;
    setConnected(true);
  }, [cloud]);

  const disconnect = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    connectedRef.current = false;
    setConnected(false);
  }, []);

  // Cancel a pending debounced push if the host unmounts (no fire-after-unmount).
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  return { ...cycle, connected, requestPush, connect, disconnect };
}
