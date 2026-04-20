/**
 * Bridge Discovery Types
 *
 * Runtime announcement protocol between bridge extensions and the SPA.
 */

export type BridgeAnnouncement = {
  type: "KAIORD_BRIDGE_ANNOUNCE";
  bridgeId: string;
  extensionId: string;
  name: string;
  version: string;
  protocolVersion: number;
  capabilities: string[];
};

export type DiscoveryListener = () => void;

export type BridgeDiscovery = {
  start: () => void;
  stop: () => void;
  getExtensionId: (bridgeId: string) => string | null;
  subscribe: (listener: DiscoveryListener) => () => void;
};

export function isAnnouncement(data: unknown): data is BridgeAnnouncement {
  if (!data || typeof data !== "object") return false;
  const a = data as Record<string, unknown>;
  return (
    a.type === "KAIORD_BRIDGE_ANNOUNCE" &&
    typeof a.bridgeId === "string" &&
    a.bridgeId.length > 0 &&
    typeof a.extensionId === "string" &&
    a.extensionId.length > 0 &&
    typeof a.protocolVersion === "number"
  );
}
