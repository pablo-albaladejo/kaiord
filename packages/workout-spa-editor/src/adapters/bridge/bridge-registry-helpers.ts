/**
 * Bridge Registry Helpers
 *
 * Heartbeat management + manifest parsing. The lifecycle pruner lives
 * in `bridge-registry-prune.ts`; see `README.md` for the wall-clock
 * timer caveat.
 */

import { bridgeManifestSchema } from "../../types/bridge-schemas";
import {
  PRUNE_AFTER_MS,
  type PruneBridgesOptions,
  pruneStale,
} from "./bridge-registry-prune";
import { sendBridgeMessage } from "./bridge-transport";
import type { RegisteredBridge } from "./bridge-types";

export { PRUNE_AFTER_MS, pruneStale } from "./bridge-registry-prune";

const MAX_FAIL_COUNT = 3;
const DEFAULT_HEARTBEAT_MS = 60_000;

export function parseManifestFromPing(
  extensionId: string,
  response: { ok: boolean; data?: unknown }
): RegisteredBridge | null {
  if (!response.ok || !response.data) return null;
  const result = bridgeManifestSchema.safeParse(response.data);
  if (!result.success) {
    console.warn(`Bridge ${extensionId}: invalid manifest`);
    return null;
  }
  return {
    extensionId,
    ...result.data,
    status: "verified",
    lastSeen: new Date().toISOString(),
    failCount: 0,
  };
}

async function pingAndUpdate(
  bridge: RegisteredBridge,
  persist: (b: RegisteredBridge) => void
): Promise<void> {
  const res = await sendBridgeMessage(bridge.extensionId, { action: "ping" });
  if (res.ok) {
    bridge.status = "verified";
    bridge.lastSeen = new Date().toISOString();
    bridge.failCount = 0;
    bridge.removedAt = undefined;
    persist(bridge);
    return;
  }
  bridge.failCount += 1;
  if (bridge.failCount >= MAX_FAIL_COUNT && bridge.status === "verified") {
    bridge.status = "unavailable";
  }
  persist(bridge);
}

export function createHeartbeatManager(
  bridges: Map<string, RegisteredBridge>,
  options: PruneBridgesOptions = {}
) {
  const { notifier, repository } = options;
  let hbTimer: ReturnType<typeof setInterval> | null = null;
  let pruneTimer: ReturnType<typeof setInterval> | null = null;
  const persist = (b: RegisteredBridge) => void repository?.put(b);
  const remove = (id: string) => void repository?.delete(id);

  function start(intervalMs = DEFAULT_HEARTBEAT_MS): void {
    stop();
    const beat = () =>
      Promise.all([...bridges.values()].map((b) => pingAndUpdate(b, persist)));
    hbTimer = setInterval(() => void beat(), intervalMs);
    pruneTimer = setInterval(
      () =>
        pruneStale(bridges, {
          notifier,
          onDeleted: remove,
          onPersist: persist,
        }),
      PRUNE_AFTER_MS
    );
  }

  function stop(): void {
    if (hbTimer) clearInterval(hbTimer);
    if (pruneTimer) clearInterval(pruneTimer);
    hbTimer = null;
    pruneTimer = null;
  }

  return { start, stop };
}
