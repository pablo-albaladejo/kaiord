/**
 * Garmin Bridge Operations - Transport-level helpers for the bridge hook.
 */
import type {
  PushWorkout,
  PushWorkoutResult,
} from "../application/integrations/integration-ports";
import type { PushState } from "../contexts/garmin-bridge-types";
import { sendMessage } from "../store/garmin-extension-transport";
import { parseGarminWorkoutId } from "./garmin-push-id";

const PUSH_TIMEOUT = 15_000;
const LIST_TIMEOUT = 10_000;

export const executePush: PushWorkout = async function executePush(
  extensionId: string,
  gcn: unknown
): Promise<PushWorkoutResult> {
  const res = await sendMessage(
    extensionId,
    { action: "push", gcn },
    PUSH_TIMEOUT
  );

  if (res.error === "Extension context invalidated") {
    return { status: "invalidated" };
  }

  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    const message =
      res.error === "Extension did not respond"
        ? "Extension did not respond. Check Garmin Connect before retrying."
        : (res.error ?? "Push failed");
    return { status: "error", message, redetect };
  }

  return { status: "success", garminWorkoutId: parseGarminWorkoutId(res.data) };
};

export async function executeList(
  extensionId: string
): Promise<{ data: unknown[]; redetect: boolean }> {
  const res = await sendMessage(extensionId, { action: "list" }, LIST_TIMEOUT);

  if (res.error === "Extension context invalidated") {
    throw new Error("Extension was updated. Please try again.");
  }

  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    if (redetect) {
      throw Object.assign(new Error(res.error ?? "List failed"), {
        redetect: true,
      });
    }
    throw new Error(res.error ?? "List failed");
  }

  return {
    data: Array.isArray(res.data) ? (res.data as unknown[]) : [],
    redetect: false,
  };
}

export {
  type DetectionResult,
  evaluatePingResult,
} from "./garmin-ping-evaluation";

export const INITIAL_PUSH_STATE: PushState = { status: "idle" };
