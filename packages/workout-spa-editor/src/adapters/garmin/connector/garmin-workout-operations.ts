/**
 * Garmin Bridge Operations - Transport-level helpers for the bridge hook:
 * send a workout and list the athlete's workouts through the Garmin Bridge
 * (a raw request on protocol 2, the legacy action on protocol 1).
 */
import { SPA_ACTION_TIMEOUT_MS } from "../../../application/garmin-placement/placement-timing";
import type {
  PushWorkout,
  PushWorkoutResult,
} from "../../../application/integrations/integration-ports";
import {
  asksRedetect,
  callConnector,
  readJson,
} from "../../bridge/connector-call";
import { GARMIN_WORKOUT_PATH, GARMIN_WORKOUTS_PATH } from "./garmin-paths";
import { parseGarminWorkoutId } from "./garmin-push-id";

// A write waits longer than the extension's own deadline, so the App hears
// how it ended before it gives up.
const PUSH_TIMEOUT = SPA_ACTION_TIMEOUT_MS;
const LIST_TIMEOUT = 10_000;

export const executePush: PushWorkout = async function executePush(
  extensionId: string,
  gcn: unknown
): Promise<PushWorkoutResult> {
  const res = await callConnector(
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
    // A 401/403 re-detects, but only the extension's verified `needsReauth`
    // says the Session ended: a bare status is Garmin not answering.
    const redetect = asksRedetect(res);
    const reason = res.needsReauth === true ? "sign-in" : "not-answering";
    return { status: "error", reason, detail: res.error ?? "", redetect };
  }

  return { status: "success", garminWorkoutId: parseGarminWorkoutId(res.data) };
};

export async function executeList(
  extensionId: string
): Promise<{ data: unknown[]; redetect: boolean }> {
  const res = await callConnector(
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
    if (asksRedetect(res)) {
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
