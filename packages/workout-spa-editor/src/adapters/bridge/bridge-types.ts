/**
 * Bridge Types
 *
 * Type definitions for bridge registry and operations.
 */

import type { BridgeCapability } from "../../types/bridge-schemas";

export type BridgeStatus = "verified" | "unavailable" | "removed";

export type RegisteredBridge = {
  extensionId: string;
  id: string;
  name: string;
  version: string;
  protocolVersion: number;
  capabilities: BridgeCapability[];
  status: BridgeStatus;
  lastSeen: string;
  failCount: number;
  /**
   * Wall-clock timestamp (ms) when the bridge transitioned to
   * `"removed"`. Used to decide when to delete the row (24h after
   * transition). Undefined for bridges never marked removed.
   */
  removedAt?: number;
};

export type BridgePersistedRow = Omit<RegisteredBridge, never>;

export type BridgeRepository = {
  getAll: () => Promise<RegisteredBridge[]>;
  put: (bridge: RegisteredBridge) => Promise<void>;
  delete: (extensionId: string) => Promise<void>;
};

export type BridgeNotifier = (event: {
  type: "removed";
  bridge: RegisteredBridge;
}) => void;

export type BridgeRegistry = {
  detectBridge: (extensionId: string) => Promise<RegisteredBridge | null>;
  /**
   * Loads any persisted bridges from the configured repository. Called
   * once on boot before `startHeartbeat()` so the 24h-unavailable /
   * 24h-removed timers resume from the stored `lastSeen` / `removedAt`.
   */
  hydrate: () => Promise<void>;
  getBridge: (extensionId: string) => RegisteredBridge | undefined;
  getAllBridges: () => RegisteredBridge[];
  hasCapability: (capability: BridgeCapability) => boolean;
  startHeartbeat: (intervalMs?: number) => void;
  stopHeartbeat: () => void;
  destroy: () => void;
};
