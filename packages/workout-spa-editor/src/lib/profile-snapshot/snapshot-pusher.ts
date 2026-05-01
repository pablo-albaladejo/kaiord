/**
 * Snapshot Pusher.
 *
 * Invariants: only ok:true updates the persisted fingerprint;
 * timeout / ok:false / Unknown-action leave it unchanged. Callers
 * fire-and-forget; rate-limit failures are silent (no toast).
 */

import { fingerprintSnapshot, type ProfileSnapshot } from "@kaiord/core";

import type { RegisteredBridge } from "../../adapters/bridge/bridge-types";
import type { PushOutcome, SnapshotPusherDeps } from "./snapshot-pusher-types";

export type {
  PushOutcome,
  SnapshotPusherDeps,
  SnapshotTransport,
} from "./snapshot-pusher-types";

const isVerified = (bridge: RegisteredBridge): boolean =>
  bridge.status === "verified";

const sendOnce = async (
  deps: SnapshotPusherDeps,
  bridge: RegisteredBridge,
  message: unknown
): Promise<PushOutcome> => {
  try {
    const response = await deps.enqueue({
      bridgeId: bridge.id,
      execute: () => deps.transport(bridge.extensionId, message),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "rate-limited";
  }
};

const buildPushSnapshot =
  (deps: SnapshotPusherDeps) =>
  async (
    bridge: RegisteredBridge,
    snapshot: ProfileSnapshot,
    profileId: string
  ): Promise<PushOutcome> => {
    if (!isVerified(bridge)) return "skipped";
    const next = fingerprintSnapshot(profileId, snapshot);
    if (bridge.lastSuccessfulFingerprint === next) return "deduped";
    const outcome = await sendOnce(deps, bridge, {
      action: "profile-snapshot",
      snapshot,
    });
    if (outcome === "sent") {
      await deps.bridges.put({ ...bridge, lastSuccessfulFingerprint: next });
    }
    return outcome;
  };

const buildClearSnapshot =
  (deps: SnapshotPusherDeps) =>
  async (bridge: RegisteredBridge): Promise<PushOutcome> => {
    if (!isVerified(bridge)) {
      if (!bridge.pendingClear) {
        await deps.bridges.put({ ...bridge, pendingClear: true });
      }
      return "skipped";
    }
    const outcome = await sendOnce(deps, bridge, {
      action: "profile-snapshot-clear",
    });
    if (outcome === "sent") {
      await deps.bridges.put({
        ...bridge,
        pendingClear: false,
        lastSuccessfulFingerprint: null,
      });
    }
    return outcome;
  };

export const createSnapshotPusher = (deps: SnapshotPusherDeps) => ({
  pushSnapshot: buildPushSnapshot(deps),
  clearSnapshot: buildClearSnapshot(deps),
});
