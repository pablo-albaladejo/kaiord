/**
 * Bridge Registry
 *
 * Detects configured bridges on boot via env vars +
 * chrome.runtime.sendMessage ping. Validates responses
 * against BridgeManifest Zod schema. Manages lifecycle.
 */

import {
  createHeartbeatManager,
  parseManifestFromPing,
} from "./bridge-registry-helpers";
import { sendBridgeMessage } from "./bridge-transport";
import type { BridgeRegistry, RegisteredBridge } from "./bridge-types";

export function createBridgeRegistry(): BridgeRegistry {
  const bridges = new Map<string, RegisteredBridge>();
  const hb = createHeartbeatManager(bridges);

  async function detectBridge(
    extensionId: string
  ): Promise<RegisteredBridge | null> {
    const response = await sendBridgeMessage(extensionId, {
      action: "ping",
    });
    const bridge = parseManifestFromPing(extensionId, response);
    if (bridge) bridges.set(extensionId, bridge);
    return bridge;
  }

  return {
    detectBridge,
    getBridge: (id) => bridges.get(id),
    getAllBridges: () => [...bridges.values()],
    hasCapability: (cap) =>
      [...bridges.values()].some(
        (b) => b.status === "verified" && b.capabilities.includes(cap)
      ),
    startHeartbeat: (ms) => hb.start(ms),
    stopHeartbeat: hb.stop,
    destroy: hb.stop,
  };
}
