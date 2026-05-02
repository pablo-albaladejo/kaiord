/**
 * useProfileSnapshotPush — wires the SPA's active profile to the
 * bridge popup snapshot push pipeline.
 *
 * Triggers on every reactive change to the joined view of:
 *   - active profile (`useActiveProfileLive` → meta.activeProfileId
 *     joined with profiles[id]); a content fingerprint deduplicates
 *     no-op renders
 *   - registered bridges (live read of the `bridges` Dexie table)
 *
 * On profile mutation OR a bridge transitioning to VERIFIED:
 *   - if profile is set → push fresh snapshot to every VERIFIED bridge
 *     (fingerprint-deduplicated by `createSnapshotPusher`)
 *   - if profile was deleted (id transitions from set to null)
 *     → emit `profile-snapshot-clear` to every VERIFIED bridge AND
 *     mark `pendingClear` on UNAVAILABLE bridges so the next VERIFIED
 *     transition emits the clear before any new push
 *
 * The push is non-blocking; the hook returns nothing.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import type { RegisteredBridge } from "../adapters/bridge/bridge-types";
import { createOperationQueue } from "../adapters/bridge/operation-queue";
import { createDexieBridgeRepository } from "../adapters/dexie/dexie-bridge-repository";
import { db } from "../adapters/dexie/dexie-database";
import {
  clearActiveProfile,
  pushActiveProfile,
} from "../lib/profile-snapshot/push-active-profile";
import { useActiveProfileLive } from "./use-active-profile-live";

const BRIDGE_QUEUE = createOperationQueue();

const liveBridges = (): RegisteredBridge[] | undefined =>
  // Subscribed via useLiveQuery below.
  undefined;

export const useProfileSnapshotPush = (): void => {
  const active = useActiveProfileLive();
  const bridges = useLiveQuery<RegisteredBridge[]>(
    () => db.table<RegisteredBridge>("bridges").toArray(),
    []
  );
  const lastProfileIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (active === undefined || bridges === undefined) return;

    const repo = createDexieBridgeRepository(db);
    const deps = {
      transport: sendBridgeMessage,
      bridgesRepo: repo,
      enqueue: BRIDGE_QUEUE.enqueue,
    } as const;

    const previousId = lastProfileIdRef.current;
    lastProfileIdRef.current = active.id;

    if (active.profile) {
      void pushActiveProfile(active.profile, bridges, deps);
      return;
    }

    // Active profile was deleted (id transitioned set → null) — emit
    // the clear. First-mount with null id is also handled (no-op
    // because no bridges have stale snapshot from this session).
    if (previousId && !active.id) {
      void clearActiveProfile(bridges, deps);
    }
  }, [active, bridges]);
};

void liveBridges;
