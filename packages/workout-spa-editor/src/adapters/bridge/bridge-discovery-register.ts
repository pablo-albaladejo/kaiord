import type { BridgeManifest } from "../../types/bridge-schemas";
import type { BridgeAnnouncement } from "./bridge-discovery-types";
import { isAcceptedBridgeProtocol } from "./bridge-protocol";

export type DiscoveryState = {
  ids: Map<string, string>;
  caps: Map<string, readonly string[]>;
  outdated: Set<string>;
};

/**
 * Registers a verified announcement and reports whether anything changed.
 * A genuine extension on a protocol this App does not accept is not
 * registered (nothing is read or sent through it), but it is remembered as
 * outdated, so its Connection offers Update rather than Install (#1098).
 */
export const register = (
  { ids, caps, outdated }: DiscoveryState,
  ann: BridgeAnnouncement,
  manifest: BridgeManifest
): boolean => {
  if (!isAcceptedBridgeProtocol(ann.bridgeId, manifest.protocolVersion)) {
    if (outdated.has(ann.bridgeId)) return false;
    outdated.add(ann.bridgeId);
    return true;
  }
  outdated.delete(ann.bridgeId);
  ids.set(ann.bridgeId, ann.extensionId);
  caps.set(ann.bridgeId, manifest.capabilities);
  return true;
};
