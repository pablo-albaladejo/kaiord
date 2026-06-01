/**
 * useSyncAutoPush — drive a debounced cloud push from live Dexie changes.
 *
 * Observes the row counts of the user-owned tables via `useLiveQuery`;
 * whenever the aggregate count changes (a create/delete settles) it asks
 * the sync engine for a debounced push, so a burst of edits collapses to
 * a single Drive write. This lives in a hook (not a Zustand store), so it
 * does not violate the no-write-through guards.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { useSync } from "../contexts/sync-context";
import { useAutoPush } from "./use-auto-push";

const SYNCED_TABLES = [
  "workouts",
  "templates",
  "profiles",
  "aiProviders",
  "tombstones",
] as const;

async function countSyncedRows(): Promise<number> {
  const counts = await Promise.all(
    SYNCED_TABLES.map((name) => db.table(name).count())
  );
  return counts.reduce((sum, n) => sum + n, 0);
}

export function useSyncAutoPush(): void {
  const { connected, requestPush } = useSync();
  const token = useLiveQuery(countSyncedRows, [], -1);
  // Only arm auto-push once an account is connected; the token still
  // advances either way, but requestPush no-ops while disconnected.
  useAutoPush(connected ? token : -1, requestPush);
}
