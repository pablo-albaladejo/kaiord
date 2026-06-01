/**
 * useSyncAutoPush — drive a debounced cloud push from live Dexie changes.
 *
 * Observes the synced tables via `useLiveQuery` and builds a change token
 * (row count + latest timestamp) that advances on creates, deletes, AND
 * in-place edits — so editing an existing workout arms the push, not only
 * adding/removing rows. Whenever the token changes it asks the sync engine
 * for a debounced push, so a burst of edits collapses to a single Drive
 * write. This lives in a hook (not a Zustand store), so it does not violate
 * the no-write-through guards.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { useSync } from "../contexts/sync-context";
import { buildChangeToken } from "./sync-change-token";
import { useAutoPush } from "./use-auto-push";

const SYNCED_TABLES = [
  "workouts",
  "templates",
  "profiles",
  "aiProviders",
  "tombstones",
] as const;

// Real tokens always contain ":", so an empty string is a safe sentinel for
// "loading / disconnected" that never collides with a genuine change token.
const DISCONNECTED = "";

async function syncedChangeToken(): Promise<string> {
  const entries = await Promise.all(
    SYNCED_TABLES.map(
      async (name) =>
        [
          name,
          (await db.table(name).toArray()) as Record<string, unknown>[],
        ] as const
    )
  );
  return buildChangeToken(Object.fromEntries(entries));
}

export function useSyncAutoPush(): void {
  const { connected, requestPush } = useSync();
  const token = useLiveQuery(syncedChangeToken, [], DISCONNECTED);
  // Only arm auto-push once an account is connected; while disconnected the
  // token is pinned to the sentinel so requestPush is never reached.
  useAutoPush(connected ? token : DISCONNECTED, requestPush);
}
