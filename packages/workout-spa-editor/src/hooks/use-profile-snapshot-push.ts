/**
 * useProfileSnapshotPush — wires the SPA's active profile to the
 * bridge popup snapshot push pipeline.
 *
 * Sources of truth:
 *   - active profile: `useActiveProfileLive` (live join of
 *     meta.activeProfileId and profiles[id]).
 *   - registered bridges: `useDiscoveredBridges`, which reads from
 *     the in-memory `bridgeDiscovery` singleton (NOT the Dexie
 *     `bridges` table — that table is unwritten in this repo today).
 *
 * Per-bridge content-fingerprint dedup is held in an in-memory ref;
 * we are not persisting it across reloads since the cost of an
 * extra push on a fresh tab is negligible.
 */

import { fingerprintSnapshot, type ProfileSnapshot } from "@kaiord/core";
import { useEffect, useRef } from "react";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import { profileToSnapshot } from "../lib/profile-snapshot/profile-to-snapshot";
import type { Profile } from "../types/profile";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useDiscoveredBridges } from "./use-discovered-bridges";

const pickActiveSport = (
  profile: Profile
): "cycling" | "running" | "swimming" | undefined => {
  if (profile.sportZones.cycling?.thresholds.ftp !== undefined)
    return "cycling";
  if (profile.sportZones.running?.thresholds.lthr !== undefined)
    return "running";
  if (profile.sportZones.swimming?.thresholds.thresholdPace !== undefined)
    return "swimming";
  if (profile.sportZones.cycling?.thresholds.lthr !== undefined)
    return "cycling";
  return undefined;
};

export const useProfileSnapshotPush = (): void => {
  const active = useActiveProfileLive();
  const bridges = useDiscoveredBridges();
  const lastFingerprintRef = useRef<Map<string, string>>(new Map());
  const lastProfileIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (active === undefined) return;
    const previousId = lastProfileIdRef.current;
    lastProfileIdRef.current = active.id;

    if (active.profile && bridges.length > 0) {
      const profile = active.profile;
      const snapshot: ProfileSnapshot = profileToSnapshot(
        profile,
        pickActiveSport(profile)
      );
      const fp = fingerprintSnapshot(profile.id, snapshot);
      for (const bridge of bridges) {
        if (lastFingerprintRef.current.get(bridge.extensionId) === fp) continue;
        sendBridgeMessage(bridge.extensionId, {
          action: "profile-snapshot",
          snapshot,
        })
          .then((res) => {
            if (res?.ok) lastFingerprintRef.current.set(bridge.extensionId, fp);
          })
          .catch(() => {});
      }
      return;
    }

    if (previousId && !active.id && bridges.length > 0) {
      for (const bridge of bridges) {
        sendBridgeMessage(bridge.extensionId, {
          action: "profile-snapshot-clear",
        })
          .then(() => lastFingerprintRef.current.delete(bridge.extensionId))
          .catch(() => {});
      }
    }
  }, [active, bridges]);
};
