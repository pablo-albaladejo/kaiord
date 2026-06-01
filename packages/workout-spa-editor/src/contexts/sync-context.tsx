/**
 * SyncProvider — app-wide cross-device sync runtime.
 *
 * Holds the single `useSyncEngine` instance so every consumer (Settings
 * controls, edit-triggered auto-push) shares one status machine. On app
 * open, once persistence has booted and an account is connected, it runs
 * one pull-merge-push cycle so a freshly opened device adopts the remote
 * snapshot before normal use. Sync failures stay non-fatal — the local
 * database remains the source of truth.
 */

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

import type { SyncEngine } from "../hooks/sync-engine-types";
import { useSyncEngine } from "../hooks/use-sync-engine";
import type { CloudSyncPort } from "../ports/cloud-sync-port";
import type { SnapshotPort } from "../ports/snapshot-port";

const SyncContext = createContext<SyncEngine | null>(null);

export type SyncProviderProps = {
  cloud: CloudSyncPort;
  snapshotPort: SnapshotPort;
  deviceId: string;
  children: ReactNode;
};

export const SyncProvider = ({
  cloud,
  snapshotPort,
  deviceId,
  children,
}: SyncProviderProps) => {
  const engine = useSyncEngine({ cloud, snapshotPort, deviceId });
  const bootstrapped = useRef(false);
  const { connected, syncNow } = engine;

  useEffect(() => {
    if (bootstrapped.current || !connected) return;
    bootstrapped.current = true;
    void syncNow();
  }, [connected, syncNow]);

  return <SyncContext.Provider value={engine}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncEngine => {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return ctx;
};
