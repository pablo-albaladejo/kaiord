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
import type {
  BridgeNotifier,
  BridgeRegistry,
  BridgeRepository,
  RegisteredBridge,
} from "./bridge-types";

export type CreateBridgeRegistryOptions = {
  notifier?: BridgeNotifier;
  repository?: BridgeRepository;
};

export function createBridgeRegistry(
  options: CreateBridgeRegistryOptions = {}
): BridgeRegistry {
  const { notifier, repository } = options;
  const bridges = new Map<string, RegisteredBridge>();
  const hb = createHeartbeatManager(bridges, { notifier, repository });

  async function detectBridge(
    extensionId: string
  ): Promise<RegisteredBridge | null> {
    const response = await sendBridgeMessage(extensionId, {
      action: "ping",
    });
    const bridge = parseManifestFromPing(extensionId, response);
    if (bridge) {
      bridges.set(extensionId, bridge);
      if (repository) void repository.put(bridge);
    }
    return bridge;
  }

  async function hydrate(): Promise<void> {
    if (!repository) return;
    const rows = await repository.getAll();
    for (const row of rows) bridges.set(row.extensionId, row);
  }

  return {
    detectBridge,
    hydrate,
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
