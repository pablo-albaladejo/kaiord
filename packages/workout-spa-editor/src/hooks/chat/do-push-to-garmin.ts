/**
 * Pushes a persisted workout to Garmin and places it on its date in the
 * Garmin calendar (`pushWorkoutToGarminCalendar`). Governed like every
 * export: no active, enabled export route to Garmin ⇒ a clear
 * `no_active_export_route` tool error. A library push that lost to a run
 * already in flight is `push_in_progress`, one the bridge failed is
 * `push_failed`, and a workout whose pace zone targets the profile cannot
 * resolve is `missing_pace_zones`, `incomplete_pace_zones` or
 * `unsupported_pace_zone_sport`, and one with %FTP power targets but no
 * FTP to resolve them is `missing_ftp` or `sport_without_power_zones`, so
 * this never throws for any of them.
 *
 * A workout that is not the active athlete's is `workout_not_found`.
 *
 * Otherwise the result carries `calendar`: the placement's kind, an
 * app-authored enum, with a `failed` one's `reason`. Any exception on this
 * path is `push_failed`, never the exception's text. When Garmin confirmed the library workout id, the
 * record is re-persisted with that id so the calendar lifecycle badge
 * reflects the push; an unconfirmed push persists nothing, so neither a
 * sentinel nor `"pending"` ever becomes a push id.
 */
import { logGarminPushFailure } from "../../application/garmin-placement/log-garmin-push-failure";
import type { PlacementResult } from "../../application/garmin-placement/placement-result";
import { placeRecord } from "../garmin-place-record";
import { libraryError } from "./garmin-library-error";
import { isOwnedWorkout } from "./is-owned-workout";

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
  profileId: string,
  ...args: Parameters<typeof pushAndRecord>
): Promise<unknown> => {
  const [persistence, , workoutId] = args;
  try {
    if (!(await isOwnedWorkout(persistence, profileId, workoutId))) {
      return { error: "workout_not_found" };
    }
    return await pushAndRecord(...args);
  } catch (error) {
    // An exception's text never reaches the model; it is only logged.
    logGarminPushFailure(error);
    return { error: "push_failed" };
  }
};
