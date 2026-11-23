/**
 * Garmin Bridge Operations - Transport-level helpers for the bridge hook:
 * send a workout and list the athlete's workouts through the Garmin Bridge
 * (a raw request on protocol 2, the legacy action on protocol 1).
 */
import { callGarmin } from "../adapters/garmin/connector/garmin-bridge-call";
import {
  GARMIN_WORKOUT_PATH,
  GARMIN_WORKOUTS_PATH,
} from "../adapters/garmin/connector/garmin-paths";
import { readJson } from "../adapters/garmin/connector/read-garmin-answers";
import { SPA_ACTION_TIMEOUT_MS } from "../application/garmin-placement/placement-timing";
import type {
  PushWorkout,
  PushWorkoutResult,
} from "../application/integrations/integration-ports";
import type { PushState } from "../contexts/garmin-bridge-types";
import { parseGarminWorkoutId } from "./garmin-push-id";

// A write waits longer than the extension's own deadline, so the App hears
// how it ended before it gives up.
const PUSH_TIMEOUT = SPA_ACTION_TIMEOUT_MS;
const LIST_TIMEOUT = 10_000;

export const executePush: PushWorkout = async function executePush(
  extensionId: string,
  gcn: unknown
): Promise<PushWorkoutResult> {
  const res = await callGarmin(
    extensionId,
    {
      method: "POST",
      path: GARMIN_WORKOUT_PATH,
      body: gcn,
      legacy: { action: "push", gcn },
      read: readJson,
    },
    PUSH_TIMEOUT
  );

  if (res.error === "Extension context invalidated") {
    return { status: "invalidated" };
  }

  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    const reason = redetect ? "sign-in" : "not-answering";
    return { status: "error", reason, detail: res.error ?? "", redetect };
  }

  return { status: "success", garminWorkoutId: parseGarminWorkoutId(res.data) };
};

export async function executeList(
  extensionId: string
): Promise<{ data: unknown[]; redetect: boolean }> {
  const res = await callGarmin(
    extensionId,
    {
      method: "GET",
      path: GARMIN_WORKOUTS_PATH,
      legacy: { action: "list" },
      read: readJson,
    },
    LIST_TIMEOUT
  );

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
