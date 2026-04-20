/**
 * Bridge lifecycle pruning.
 *
 * See `README.md` for the wall-clock-based timer caveat.
 */

import type {
  BridgeNotifier,
  BridgeRepository,
  RegisteredBridge,
} from "./bridge-types";

export const PRUNE_AFTER_MS = 24 * 60 * 60 * 1_000;

function demoteToRemoved(
  bridge: RegisteredBridge,
  now: number,
  options: {
    notifier?: BridgeNotifier;
    onPersist?: (b: RegisteredBridge) => void;
  }
): void {
  bridge.status = "removed";
  bridge.removedAt = now;
  options.onPersist?.(bridge);
  options.notifier?.({ type: "removed", bridge });
}

/**
 * Transitions bridges through the lifecycle:
 *  - `unavailable` for >=24h → `removed` (notify + keep the row)
 *  - `removed` for >=24h     → deleted (entry leaves the map + repo)
 *
 * Anchors on `lastSeen` (for `unavailable`) or `removedAt` (falling
 * back to `lastSeen` if missing) so the timer resumes correctly across
 * browser sessions when the rows are loaded from Dexie.
 */
export function pruneStale(
  bridges: Map<string, RegisteredBridge>,
  options: {
    now?: number;
    notifier?: BridgeNotifier;
    onDeleted?: (extensionId: string) => void;
    onPersist?: (bridge: RegisteredBridge) => void;
  } = {}
): void {
  const { now = Date.now(), notifier, onDeleted, onPersist } = options;

  for (const [id, bridge] of bridges) {
    if (bridge.status === "unavailable") {
      const elapsed = now - new Date(bridge.lastSeen).getTime();
      if (elapsed >= PRUNE_AFTER_MS) {
        demoteToRemoved(bridge, now, { notifier, onPersist });
      }
      continue;
    }

    if (bridge.status === "removed") {
      const anchor = bridge.removedAt ?? new Date(bridge.lastSeen).getTime();
      if (now - anchor >= PRUNE_AFTER_MS) {
        bridges.delete(id);
        onDeleted?.(id);
      }
    }
  }
}

export type PruneBridgesOptions = {
  notifier?: BridgeNotifier;
  repository?: BridgeRepository;
};
