import { loadGarminWorkoutOperations } from "../adapters/garmin/connector/load-garmin-workout-operations";
import type {
  GarminPushOutcome,
  PushState,
} from "../contexts/garmin-bridge-types";
import { logFailure } from "../lib/log-failure";
import { getGarminExtensionId } from "./use-garmin-bridge-action-helpers";

/**
 * Resolves with the push outcome. Callers MUST read `success` (rather
 * than assuming success once the promise resolves) — this never rejects,
 * so a caller ignoring the result would otherwise report success even
 * when the bridge returned an error. `garminWorkoutId` carries the
 * Garmin-assigned id parsed from the push response (null when absent).
 * When the send itself cannot be loaded, Garmin was never asked:
 * `notLoaded` says so, and the push state is the App's own failure.
 */
export const runPush = async (
  gcn: unknown,
  setPushing: (s: PushState) => void,
  redetect: () => Promise<void>
): Promise<GarminPushOutcome> => {
  setPushing({ status: "loading" });
  const operations = await loadGarminWorkoutOperations().catch(
    (error: unknown) => {
      logFailure("garmin-send", error);
      return null;
    }
  );
  if (!operations) {
    setPushing({ status: "error", reason: "not-loaded" });
    return { success: false, garminWorkoutId: null, notLoaded: true };
  }
  const result = await operations.executePush(getGarminExtensionId(), gcn);
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
