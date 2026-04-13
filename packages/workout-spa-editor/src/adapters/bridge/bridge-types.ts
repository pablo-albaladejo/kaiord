/**
 * Bridge Types
 *
 * Type definitions for bridge registry and operations.
 */

import type { BridgeCapability } from "../../types/bridge-schemas";

export type BridgeStatus = "verified" | "unavailable";

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
};

export type BridgeRegistry = {
  detectBridge: (extensionId: string) => Promise<RegisteredBridge | null>;
  getBridge: (extensionId: string) => RegisteredBridge | undefined;
  getAllBridges: () => RegisteredBridge[];
  hasCapability: (capability: BridgeCapability) => boolean;
  startHeartbeat: (intervalMs?: number) => void;
  stopHeartbeat: () => void;
  destroy: () => void;
};
