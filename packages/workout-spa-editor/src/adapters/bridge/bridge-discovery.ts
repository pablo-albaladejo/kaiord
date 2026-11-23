/**
 * Bridge Discovery
 *
 * Listens for KAIORD_BRIDGE_ANNOUNCE messages on `window`, verifies each
 * announcement via a ping against the announced extensionId, and exposes
 * the verified `bridgeId → extensionId` mapping at runtime. Replaces
 * build-time `VITE_*_EXTENSION_ID` env var coupling.
 */

import type { BridgeManifest } from "../../types/bridge-schemas";
import { register } from "./bridge-discovery-register";
import {
  type BridgeAnnouncement,
  type BridgeDiscovery,
  type DiscoveryListener,
  isAnnouncement,
  type VerifiedBridge,
} from "./bridge-discovery-types";
import { verifyAnnouncement } from "./bridge-discovery-verify";

/** Exported so callers can derive when a silent discovery has had its
    opening chance: nothing is asked before this elapses. */
export const DISCOVER_REQUEST_DELAY_MS = 3_000;

type VerifyFn = (ann: BridgeAnnouncement) => Promise<BridgeManifest | null>;

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
  const caps = new Map<string, readonly string[]>();
  const outdated = new Set<string>();
  const verified = new Map<string, VerifiedBridge>();
  const listeners = new Set<DiscoveryListener>();
  let handler: ((event: MessageEvent) => void) | null = null;
  let discoverTimer: ReturnType<typeof setTimeout> | null = null;

  const notify = () => listeners.forEach((l) => l());

  async function handleAnnouncement(ann: BridgeAnnouncement): Promise<void> {
    if (ids.get(ann.bridgeId) === ann.extensionId) return;
    const manifest = await verify(ann);
    if (manifest && register({ ids, caps, outdated, verified }, ann, manifest)) notify();
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
    getCapabilities: (id) => caps.get(id) ?? null,
    isOutdated: (id) => outdated.has(id),
    getVerified: (id) => verified.get(id) ?? null,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Singleton survives Vite HMR by parking on globalThis: re-importing
// this module after a hot update would otherwise instantiate a fresh
// `BridgeDiscovery` with an empty `ids` map, while React hooks already
// subscribed via `useSyncExternalStore` keep listening to the previous
// instance — leading to "discovery says it has the bridges but my
// hooks don't see them" bugs that only show up in dev.
type GlobalWithDiscovery = { __KAIORD_BRIDGE_DISCOVERY__?: BridgeDiscovery };
const g = globalThis as unknown as GlobalWithDiscovery;
export const bridgeDiscovery: BridgeDiscovery =
  g.__KAIORD_BRIDGE_DISCOVERY__ ?? createBridgeDiscovery();
g.__KAIORD_BRIDGE_DISCOVERY__ = bridgeDiscovery;
