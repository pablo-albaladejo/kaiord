/**
 * Bridge Registry Helpers
 *
 * Heartbeat management, manifest parsing, and bridge pruning.
 */

import { bridgeManifestSchema } from "../../types/bridge-schemas";
import { sendBridgeMessage } from "./bridge-transport";
import type { RegisteredBridge } from "./bridge-types";

const MAX_FAIL_COUNT = 3;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1_000;
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

async function pingAndUpdate(bridge: RegisteredBridge): Promise<void> {
  const res = await sendBridgeMessage(bridge.extensionId, {
    action: "ping",
  });

  if (res.ok) {
    bridge.status = "verified";
    bridge.lastSeen = new Date().toISOString();
    bridge.failCount = 0;
    return;
  }

  bridge.failCount += 1;
  if (bridge.failCount >= MAX_FAIL_COUNT) {
    bridge.status = "unavailable";
  }
}

function pruneStale(bridges: Map<string, RegisteredBridge>): void {
  const now = Date.now();
  for (const [id, bridge] of bridges) {
    if (bridge.status !== "unavailable") continue;
    const elapsed = now - new Date(bridge.lastSeen).getTime();
    if (elapsed >= PRUNE_AFTER_MS) bridges.delete(id);
  }
}

export function createHeartbeatManager(bridges: Map<string, RegisteredBridge>) {
  let hbTimer: ReturnType<typeof setInterval> | null = null;
  let pruneTimer: ReturnType<typeof setInterval> | null = null;

  function start(intervalMs = DEFAULT_HEARTBEAT_MS): void {
    stop();
    const beat = () => Promise.all([...bridges.values()].map(pingAndUpdate));
    hbTimer = setInterval(() => void beat(), intervalMs);
    pruneTimer = setInterval(() => pruneStale(bridges), PRUNE_AFTER_MS);
  }

  function stop(): void {
    if (hbTimer) clearInterval(hbTimer);
    if (pruneTimer) clearInterval(pruneTimer);
    hbTimer = null;
    pruneTimer = null;
  }

  return { start, stop };
}
