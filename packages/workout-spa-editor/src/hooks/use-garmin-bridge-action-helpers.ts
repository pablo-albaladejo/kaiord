/**
 * Helpers for `useGarminBridgeActions` — detection + push flows factored
 * out of the hook so the hook body stays within the file-size budget.
 * Extension IDs come from the bridge discovery singleton at call time.
 */

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import type {
  GarminPushOutcome,
  PushState,
} from "../contexts/garmin-bridge-types";
import { ping } from "../store/garmin-extension-transport";
import { evaluatePingResult, executePush } from "./garmin-bridge-operations";

export const getGarminExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("garmin-bridge") ?? "";

export type DetectSetters = {
  setExtensionInstalled: (v: boolean) => void;
  setSessionActive: (v: boolean) => void;
  setLastError: (v: string | null) => void;
};

export const runDetect = async ({
  setExtensionInstalled,
  setSessionActive,
  setLastError,
}: DetectSetters): Promise<void> => {
  const extensionId = getGarminExtensionId();
  if (!extensionId) {
    setExtensionInstalled(false);
    setSessionActive(false);
    setLastError(null);
    return;
  }
  const res = await ping(extensionId);
  const result = evaluatePingResult(res);
  setExtensionInstalled(result.installed);
  setSessionActive(result.installed && result.session);
  setLastError(result.installed ? result.error : null);
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
    setPushing({
      status: "error",
      message: "Extension was updated. Please try again.",
    });
    return { success: false, garminWorkoutId: null };
  }
  if (result.status === "error") {
    if (result.redetect) await redetect();
    setPushing({ status: "error", message: result.message });
    return { success: false, garminWorkoutId: null };
  }
  setPushing({ status: "success" });
  return { success: true, garminWorkoutId: result.garminWorkoutId };
};
