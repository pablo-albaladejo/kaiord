/**
 * Push the active profile's snapshot to every VERIFIED bridge.
 *
 * Pure orchestration: derives the snapshot via `profileToSnapshot`,
 * iterates over registered bridges, and delegates per-bridge push +
 * de-duplication to `createSnapshotPusher`. The hook
 * `useProfileSnapshotPush` calls this whenever the active profile
 * row mutates AND whenever a bridge transitions to VERIFIED.
 *
 * Non-blocking: callers fire-and-forget; per-bridge errors are
 * swallowed (logged at debug level) so one failing bridge cannot
 * block the others.
 */

import type {
  BridgeRepository,
  RegisteredBridge,
} from "../../adapters/bridge/bridge-types";
import type { Profile } from "../../types/profile";
import { type ActiveSport, profileToSnapshot } from "./profile-to-snapshot";
import {
  createSnapshotPusher,
  type SnapshotTransport,
} from "./snapshot-pusher";

export type PushAllDeps = {
  readonly transport: SnapshotTransport;
  readonly bridgesRepo: BridgeRepository;
  readonly enqueue: <T>(args: {
    bridgeId: string;
    execute: () => Promise<T>;
  }) => Promise<T>;
};

const pickActiveSport = (profile: Profile): ActiveSport | undefined => {
  // Heuristic: pick the first sport with a configured threshold so the
  // snapshot's heartRate.lthr falls back to whatever the user has set.
  // The SPA has no explicit `activeSport` field on the Profile schema
  // today; this picks the most-likely candidate over emitting nothing.
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

export const pushActiveProfile = async (
  profile: Profile,
  bridges: readonly RegisteredBridge[],
  deps: PushAllDeps
): Promise<void> => {
  const verified = bridges.filter((b) => b.status === "verified");
  if (verified.length === 0) return;

  const activeSport = pickActiveSport(profile);
  const snapshot = profileToSnapshot(profile, activeSport);
  const pusher = createSnapshotPusher({
    transport: deps.transport,
    bridges: deps.bridgesRepo,
    enqueue: deps.enqueue,
  });

  await Promise.all(
    verified.map(async (bridge) => {
      try {
        await pusher.pushSnapshot(bridge, snapshot, profile.id);
      } catch {
        // Per-bridge failure is silent; the next mutation or VERIFIED
        // recovery will retry.
      }
    })
  );
};

export const clearActiveProfile = async (
  bridges: readonly RegisteredBridge[],
  deps: PushAllDeps
): Promise<void> => {
  if (bridges.length === 0) return;
  const pusher = createSnapshotPusher({
    transport: deps.transport,
    bridges: deps.bridgesRepo,
    enqueue: deps.enqueue,
  });
  await Promise.all(
    bridges.map(async (bridge) => {
      try {
        await pusher.clearSnapshot(bridge);
      } catch {
        // Silent.
      }
    })
  );
};
