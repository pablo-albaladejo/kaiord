/**
 * Helpers for `useGarminBridgeActions` — the detection flow, factored out
 * of the hook so the hook body stays within the file-size budget (the
 * send is `runPush`).
 * Extension IDs come from the bridge discovery singleton at call time.
 */

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { PREVIOUS_BRIDGE_PROTOCOL_VERSION } from "../adapters/bridge/thin-bridge-request";
import { ping } from "../adapters/garmin/connector/garmin-ping";
import { evaluatePingResult } from "../adapters/garmin/connector/garmin-ping-evaluation";
import type { ConnectionState } from "../application/connections/connection-state";
import { msUntilDiscoverySettled } from "./garmin-discovery-window";

export const getGarminExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("garmin-bridge") ?? "";

export type DetectSetters = {
  setExtensionInstalled: (v: boolean) => void;
  setSessionActive: (v: boolean) => void;
  setFeatures: (v: readonly string[]) => void;
  setConnection: (v: ConnectionState) => void;
};

/** The store extension (protocol 1) answers `ping` with a read of one
    workout, so it is not pinged: its check is "not checked" and its features
    are the ones its verification answer carried. */
const readVerifiedWithoutPing = (set: DetectSetters): boolean => {
  const verified = bridgeDiscovery.getVerified?.("garmin-bridge");
  if (verified?.protocolVersion !== PREVIOUS_BRIDGE_PROTOCOL_VERSION) {
    return false;
  }
  set.setExtensionInstalled(true);
  set.setSessionActive(true);
  set.setFeatures(verified.features);
  set.setConnection("not-checked");
  return true;
};

const detectAbsent = ({
  setExtensionInstalled,
  setSessionActive,
  setFeatures,
  setConnection,
}: DetectSetters): void => {
  setExtensionInstalled(false);
  setSessionActive(false);
  setFeatures([]);
  // An extension on a protocol the App does not accept is not registered,
  // but it is there: Update. Absent only once discovery had its window.
  if (bridgeDiscovery.isOutdated?.("garmin-bridge") === true) {
    setConnection("outdated");
  } else {
    setConnection(msUntilDiscoverySettled() > 0 ? "checking" : "not-installed");
  }
};

export const runDetect = async (set: DetectSetters): Promise<void> => {
  const extensionId = getGarminExtensionId();
  if (!extensionId) return detectAbsent(set);
  if (readVerifiedWithoutPing(set)) return;
  const result = evaluatePingResult(await ping(extensionId));
  set.setExtensionInstalled(result.installed);
  set.setSessionActive(result.session);
  set.setFeatures(result.features);
  set.setConnection(result.connection);
};
