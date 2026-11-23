/**
 * Helpers for `useGarminBridgeActions` — detection + push flows factored
 * out of the hook so the hook body stays within the file-size budget.
 * Extension IDs come from the bridge discovery singleton at call time.
 */

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { PREVIOUS_BRIDGE_PROTOCOL_VERSION } from "../adapters/bridge/thin-bridge-request";
import { ping } from "../adapters/garmin/connector/garmin-ping";
import { evaluatePingResult } from "../adapters/garmin/connector/garmin-ping-evaluation";
import { executePush } from "../adapters/garmin/connector/garmin-workout-operations";
import type { ConnectionState } from "../application/connections/connection-state";
import type {
  GarminPushOutcome,
  PushState,
} from "../contexts/garmin-bridge-types";
import { logFailure } from "../lib/log-failure";
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

/**
 * Resolves with the push outcome. Callers MUST read `success` (rather
 * than assuming success once the promise resolves) — this never rejects,
 * so a caller ignoring the result would otherwise report success even
 * when the bridge returned an error. `garminWorkoutId` carries the
 * Garmin-assigned id parsed from the push response (null when absent).
 */
export const runPush = async (
  gcn: unknown,
  setPushing: (s: PushState) => void,
  redetect: () => Promise<void>
): Promise<GarminPushOutcome> => {
  setPushing({ status: "loading" });
  const result = await executePush(getGarminExtensionId(), gcn);
  if (result.status === "invalidated") {
    await redetect();
    setPushing({ status: "error", reason: "updated" });
    return { success: false, garminWorkoutId: null };
  }
  if (result.status === "error") {
    if (result.redetect) await redetect();
    logFailure("garmin-send", result.detail);
    setPushing({ status: "error", reason: result.reason });
    return { success: false, garminWorkoutId: null };
  }
  setPushing({ status: "success" });
  return { success: true, garminWorkoutId: result.garminWorkoutId };
};
