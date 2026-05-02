/**
 * useProfileSnapshotPush — wires the SPA's active profile to the
 * bridge popup snapshot push pipeline.
 *
 * Sources of truth:
 *   - active profile: `useActiveProfileLive`.
 *   - registered bridges: `useDiscoveredBridges` (in-memory
 *     bridge-discovery singleton — the actual source of truth).
 *
 * Per-bridge behaviour:
 *   - Content-fingerprint dedup via an in-memory ref.
 *   - 60/h-per-bridge rate limit via the shared OperationQueue.
 *   - The bridge writes `lastPushReceipt` itself inside its
 *     `profile-snapshot` handler (atomic with the snapshot write).
 *   - When the active profile is deleted while no bridges are
 *     reachable, mark `pendingClearRef` and emit
 *     `profile-snapshot-clear` on the next push tick.
 */

import { fingerprintSnapshot } from "@kaiord/core";
import { useEffect, useRef } from "react";

import { profileToSnapshot } from "../lib/profile-snapshot/profile-to-snapshot";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import {
  pickActiveSport,
  sendClear,
  sendSnapshot,
} from "./use-profile-snapshot-push-helpers";

export const useProfileSnapshotPush = (): void => {
  const active = useActiveProfileLive();
  const bridges = useDiscoveredBridges();
  const lastFingerprintRef = useRef<Map<string, string>>(new Map());
  const lastProfileIdRef = useRef<string | null | undefined>(undefined);
  const pendingClearRef = useRef<boolean>(false);

  useEffect(() => {
    if (active === undefined) return;

    if (lastProfileIdRef.current && !active.id) {
      pendingClearRef.current = true;
    }
    lastProfileIdRef.current = active.id;

    if (pendingClearRef.current && bridges.length > 0) {
      for (const bridge of bridges)
        void sendClear(bridge, lastFingerprintRef.current);
      pendingClearRef.current = false;
      return;
    }

    if (!active.profile || bridges.length === 0) return;

    const profile = active.profile;
    const snapshot = profileToSnapshot(profile, pickActiveSport(profile));
    const fp = fingerprintSnapshot(profile.id, snapshot);
    for (const bridge of bridges) {
      if (lastFingerprintRef.current.get(bridge.extensionId) === fp) continue;
      void sendSnapshot(bridge, snapshot, fp, lastFingerprintRef.current);
    }
  }, [active, bridges]);
};
