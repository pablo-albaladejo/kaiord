/**
 * useSyncAutoPush — a debounced cloud push after any write to a synced
 * table. The Dexie middleware reports every such write (an import's own
 * writes excepted), and `requestPush` debounces a burst into one Drive
 * write. This lives in a hook (not a Zustand store), so it does not violate
 * the no-write-through guards.
 */

import { useEffect } from "react";

import { onSyncedTableChange } from "../adapters/dexie/sync-change-notifier";
import { useSync } from "../contexts/sync-context";

export function useSyncAutoPush(): void {
  const { connected, requestPush } = useSync();
  useEffect(
    () => (connected ? onSyncedTableChange(requestPush) : undefined),
    [connected, requestPush]
  );
}
