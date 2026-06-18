/**
 * useSyncAutoPush — drive a debounced cloud push from live Dexie changes.
 *
 * Observes the synced tables via `useLiveQuery` and builds a change token from
 * each table's row `count` plus the max of an indexed timestamp column. The
 * token advances on creates, deletes, AND in-place edits (an edit sets
 * `updatedAt` to now, advancing the max) — so editing an existing workout arms
 * the push, not only adding/removing rows. Reading the max via an index keeps
 * the query O(tables) instead of scanning every row on every change. Whenever
 * the token changes it asks the sync engine for a debounced push, so a burst
 * of edits collapses to a single Drive write. This lives in a hook (not a
 * Zustand store), so it does not violate the no-write-through guards.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { useSync } from "../contexts/sync-context";
import { buildChangeToken, type TableSignal } from "./sync-change-token";
import { useAutoPush } from "./use-auto-push";

// [table, indexed timestamp column]. workouts/templates/profiles index
// `updatedAt` (Dexie v23); aiProviders has an indexed numeric `createdAt`
// (insertion order) and tombstones an indexed `deletedAt`.
const SYNCED_TABLES: ReadonlyArray<readonly [string, string]> = [
  ["workouts", "updatedAt"],
  ["templates", "updatedAt"],
  ["profiles", "updatedAt"],
  ["aiProviders", "createdAt"],
  ["tombstones", "deletedAt"],
];

// Real tokens always contain ":", so an empty string is a safe sentinel for
// "loading / disconnected" that never collides with a genuine change token.
const DISCONNECTED = "";

async function tableSignal(name: string, field: string): Promise<TableSignal> {
  const table = db.table(name);
  const [count, last] = await Promise.all([
    table.count(),
    table.orderBy(field).last(),
  ]);
  const latest = (last as Record<string, unknown> | undefined)?.[field];
  return { count, latest: latest == null ? "" : String(latest) };
}

async function syncedChangeToken(): Promise<string> {
  const signals = await Promise.all(
    SYNCED_TABLES.map(([name, field]) => tableSignal(name, field))
  );
  return buildChangeToken(signals);
}

export function useSyncAutoPush(): void {
  const { connected, requestPush } = useSync();
  const token = useLiveQuery(syncedChangeToken, [], DISCONNECTED);
  // Only arm auto-push once an account is connected; while disconnected the
  // token is pinned to the sentinel so requestPush is never reached.
  useAutoPush(connected ? token : DISCONNECTED, requestPush);
}
