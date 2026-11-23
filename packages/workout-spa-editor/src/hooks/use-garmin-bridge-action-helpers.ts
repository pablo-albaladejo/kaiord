/**
 * Helpers for `useGarminBridgeActions` — detection + push flows factored
 * out of the hook so the hook body stays within the file-size budget.
 * Extension IDs come from the bridge discovery singleton at call time.
 */

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import type { ConnectionState } from "../application/connections/connection-state";
import type {
  GarminPushOutcome,
  PushState,
} from "../contexts/garmin-bridge-types";
import { logFailure } from "../lib/log-failure";
import { ping } from "../store/garmin-extension-transport";
import { evaluatePingResult, executePush } from "./garmin-bridge-operations";

export const getGarminExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("garmin-bridge") ?? "";

export type DetectSetters = {
  setExtensionInstalled: (v: boolean) => void;
  setSessionActive: (v: boolean) => void;
  setFeatures: (v: readonly string[]) => void;
  setConnection: (v: ConnectionState) => void;
};

export const runDetect = async ({
  setExtensionInstalled,
  setSessionActive,
  setFeatures,
  setConnection,
}: DetectSetters): Promise<void> => {
  const extensionId = getGarminExtensionId();
  if (!extensionId) {
    setExtensionInstalled(false);
    setSessionActive(false);
    setFeatures([]);
    setConnection("not-installed");
    return;
  }
  const result = evaluatePingResult(await ping(extensionId));
  setExtensionInstalled(result.installed);
  setSessionActive(result.session);
  setFeatures(result.features);
  setConnection(result.connection);
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
