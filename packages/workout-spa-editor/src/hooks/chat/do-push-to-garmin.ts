/**
 * Pushes a persisted workout to Garmin and places it on its date in the
 * Garmin calendar (`pushWorkoutToGarminCalendar`). Governed like every
 * export: no active, enabled export route to Garmin ⇒ a clear
 * `no_active_export_route` tool error. A library push that lost to a run
 * already in flight is `push_in_progress`, one the bridge failed is
 * `push_failed`, and a workout whose pace zone targets the profile cannot
 * resolve is `missing_pace_zones`, so this never throws for any of them.
 *
 * Otherwise the result carries `calendar`: the placement's kind, an
 * app-authored enum, with a `failed` one's `reason`. Any exception on this
 * path is `push_failed`, never the exception's text. When Garmin confirmed the library workout id, the
 * record is re-persisted with that id so the calendar lifecycle badge
 * reflects the push; an unconfirmed push persists nothing, so neither a
 * sentinel nor `"pending"` ever becomes a push id.
 */
import { NoActiveExportRouteError } from "../../application/export/execute-workout-push";
import { logGarminPushFailure } from "../../application/garmin-placement/log-garmin-push-failure";
import type { PlacementResult } from "../../application/garmin-placement/placement-result";
import { placeRecord } from "../garmin-place-record";
import { GARMIN_BRIDGE_ID } from "../garmin-push-fn";

const MISSING_PACE_ZONES =
  "The workout uses pace zone targets, but the athlete's profile has no " +
  "pace zones for its sport. Ask the athlete to set their threshold pace " +
  "in Athlete, then send it again.";

/** The Phase 1 failures, as the tool's error codes. */
const libraryError = (result: PlacementResult) => {
  if (result.kind !== "failed") return undefined;
  if (result.reason === "no-export-route") {
    const { message } = new NoActiveExportRouteError(GARMIN_BRIDGE_ID);
    return { error: "no_active_export_route", message };
  }
  if (result.reason === "busy") return { error: "push_in_progress" };
  if (result.reason === "library-push-failed") return { error: "push_failed" };
  if (result.reason === "missing-pace-zones")
    return { error: "missing_pace_zones", message: MISSING_PACE_ZONES };
  return undefined;
};

/** The placement's kind, and a `failed` one's reason (both app-authored). */
const calendarOf = (result: PlacementResult) =>
  result.kind === "failed"
    ? { calendar: result.kind, reason: result.reason }
    : { calendar: result.kind };

const pushAndRecord = async (
  ...args: Parameters<typeof placeRecord>
): Promise<unknown> => {
  const placed = await placeRecord(...args);
  if (!placed) return { error: "workout_not_found" };
  const { result, garminPushId } = placed;
  const error = garminPushId === null ? libraryError(result) : undefined;
  if (error) return error;
  return { workoutId: args[2], garminPushId, ...calendarOf(result) };
};

export const doPushToGarmin = async (
  ...args: Parameters<typeof pushAndRecord>
): Promise<unknown> => {
  try {
    return await pushAndRecord(...args);
  } catch (error) {
    // An exception's text never reaches the model; it is only logged.
    logGarminPushFailure(error);
    return { error: "push_failed" };
  }
};
