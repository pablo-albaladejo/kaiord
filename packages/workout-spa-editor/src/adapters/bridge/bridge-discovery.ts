/**
 * Bridge Discovery
 *
 * Listens for KAIORD_BRIDGE_ANNOUNCE messages on `window`, verifies each
 * announcement via a ping against the announced extensionId, and exposes
 * the verified `bridgeId → extensionId` mapping at runtime. Replaces
 * build-time `VITE_*_EXTENSION_ID` env var coupling.
 */

import {
  type BridgeAnnouncement,
  type BridgeDiscovery,
  type DiscoveryListener,
  isAnnouncement,
} from "./bridge-discovery-types";
import { verifyAnnouncement } from "./bridge-discovery-verify";

const DISCOVER_REQUEST_DELAY_MS = 3_000;

type VerifyFn = (ann: BridgeAnnouncement) => Promise<boolean>;

export type CreateBridgeDiscoveryOptions = {
  verify?: VerifyFn;
  discoverDelayMs?: number;
};

export function createBridgeDiscovery(
  options: CreateBridgeDiscoveryOptions = {}
): BridgeDiscovery {
  const verify = options.verify ?? verifyAnnouncement;
  const discoverDelayMs = options.discoverDelayMs ?? DISCOVER_REQUEST_DELAY_MS;
  const ids = new Map<string, string>();
  const listeners = new Set<DiscoveryListener>();
  let handler: ((event: MessageEvent) => void) | null = null;
  let discoverTimer: ReturnType<typeof setTimeout> | null = null;

  const notify = () => listeners.forEach((l) => l());

  async function handleAnnouncement(ann: BridgeAnnouncement): Promise<void> {
    if (ids.get(ann.bridgeId) === ann.extensionId) return;
    const ok = await verify(ann);
    if (!ok) return;
    ids.set(ann.bridgeId, ann.extensionId);
    notify();
  }

  function onMessage(event: MessageEvent): void {
    if (event.source !== window) return;
    if (!isAnnouncement(event.data)) return;
    void handleAnnouncement(event.data);
  }

  function start(): void {
    if (handler) return;
    handler = onMessage;
    window.addEventListener("message", handler);
    discoverTimer = setTimeout(() => {
      if (ids.size === 0) {
        window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" }, "*");
      }
    }, discoverDelayMs);
  }

  function stop(): void {
    if (handler) window.removeEventListener("message", handler);
    if (discoverTimer) clearTimeout(discoverTimer);
    handler = null;
    discoverTimer = null;
  }

  return {
    start,
    stop,
    getExtensionId: (id) => ids.get(id) ?? null,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const bridgeDiscovery = createBridgeDiscovery();
