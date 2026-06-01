/**
 * TestSyncProvider — an in-memory `SyncProvider` for tests that render
 * components reading `useSync()` (e.g. full-`App` route/analytics tests).
 * Uses the in-memory cloud + snapshot fakes so no network or Dexie write
 * occurs, and starts disconnected so no pull-on-open fires.
 */

import type { ReactNode } from "react";

import { SyncProvider } from "../contexts/sync-context";
import { createInMemoryCloudSyncPort } from "./in-memory-cloud-sync-port";
import { createInMemorySnapshotPort } from "./in-memory-snapshot-port";

export function TestSyncProvider({ children }: { children: ReactNode }) {
  return (
    <SyncProvider
      cloud={createInMemoryCloudSyncPort()}
      snapshotPort={createInMemorySnapshotPort({
        schemaVersion: 19,
        tables: {},
        tombstones: [],
      })}
      deviceId="test-device"
    >
      {children}
    </SyncProvider>
  );
}
