/**
 * Helpers for `useProfileSnapshotPush` — kept in a sibling file so the
 * hook itself stays under the per-file line cap.
 *
 * The shared `OperationQueue` lives here so every push and clear goes
 * through a single 60-ops-per-bridge-per-hour cap, mandated by the
 * SPA Bridge Protocol spec.
 */

import type { ProfileSnapshot } from "@kaiord/core";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import { createOperationQueue } from "../adapters/bridge/operation-queue";
import type { Profile } from "../types/profile";
import type { DiscoveredBridge } from "./use-discovered-bridges";

export const QUEUE = createOperationQueue(0);

export const pickActiveSport = (
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

export const sendSnapshot = (
  bridge: DiscoveredBridge,
  snapshot: ProfileSnapshot,
  fingerprint: string,
  fingerprintMap: Map<string, string>
): Promise<void> =>
  QUEUE.enqueue({
    bridgeId: bridge.bridgeId,
    execute: () =>
      sendBridgeMessage(bridge.extensionId, {
        action: "profile-snapshot",
        snapshot,
      }),
  })
    .then((res) => {
      if (res?.ok) fingerprintMap.set(bridge.extensionId, fingerprint);
    })
    .catch(() => undefined);

export const sendClear = (
  bridge: DiscoveredBridge,
  fingerprintMap: Map<string, string>
): Promise<void> =>
  QUEUE.enqueue({
    bridgeId: bridge.bridgeId,
    execute: () =>
      sendBridgeMessage(bridge.extensionId, {
        action: "profile-snapshot-clear",
      }),
  })
    .then(() => {
      fingerprintMap.delete(bridge.extensionId);
    })
    .catch(() => undefined);
