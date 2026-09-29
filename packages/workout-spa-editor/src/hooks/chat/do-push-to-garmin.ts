/**
 * Pushes a persisted workout to Garmin through the injected bridge push
 * function. Governed by `executeWorkoutPush`: no active, enabled export
 * route to Garmin ⇒ a clear `no_active_export_route` tool error instead
 * of silently attempting the push. Returns a tool-result payload; a
 * bridge-reported failure is carried as `push_failed`, and a push of the
 * same workout already in flight (the ledger's `lost-race`) as
 * `push_in_progress`, so this never throws for either. When Garmin
 * confirmed the library workout id, the record is re-persisted with that
 * id so the calendar lifecycle badge reflects the push; an unconfirmed
 * push (no Garmin-shaped id) or a lost race persists nothing, so neither
 * a sentinel nor `"pending"` ever becomes a push id. A workout with %FTP
 * power targets whose owner has no FTP returns `missing_ftp` unpushed, or
 * `sport_without_power_zones` when its sport can never hold an FTP.
 */
import { MissingFtpError } from "@kaiord/core";

import {
  executeWorkoutPush,
  NoActiveExportRouteError,
} from "../../application/export/execute-workout-push";
import { recordGarminPush } from "../../application/record-garmin-push";
import type { GarminPushOutcome } from "../../contexts/garmin-bridge-types";
import { ftpForWorkout, missingFtpReason } from "../../lib/athlete";
import type { PersistencePort } from "../../ports/persistence-port";
import { exportGcnWorkout } from "../../utils/export-workout-formats";
import {
  buildGarminPushFn,
  GARMIN_BRIDGE_ID,
  ledgerRepo,
  policyRepo,
} from "../garmin-push-fn";

const MISSING_FTP = {
  error: "missing_ftp",
  message:
    "The workout has %FTP power targets and the athlete profile has no FTP for its sport. Ask the user to set their FTP in Athlete.",
} as const;

const SPORT_WITHOUT_POWER = {
  error: "sport_without_power_zones",
  message:
    "The workout has %FTP power targets but its sport has no power zones, so no FTP applies. Ask the user to change its sport to cycling or running.",
} as const;

export const doPushToGarmin = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string
): Promise<unknown> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return { error: "workout_not_found" };
  const profile = await persistence.profiles.getById(record.profileId);
  let gcn: unknown;
  try {
    gcn = await exportGcnWorkout(
      record.krd,
      ftpForWorkout(profile, record.krd)
    );
  } catch (error) {
    if (error instanceof MissingFtpError) {
      return missingFtpReason(record.krd) === "no-ftp"
        ? MISSING_FTP
        : SPORT_WITHOUT_POWER;
    }
    throw error;
  }

  let garminPushId: string | null;
  try {
    const result = await executeWorkoutPush(
      { policyRepo, ledgerRepo },
      {
        profileId: record.profileId,
        kaiordRecordId: record.id,
        destinationBridgeId: GARMIN_BRIDGE_ID,
        payload: gcn as Record<string, unknown>,
        pushFn: buildGarminPushFn(pushWorkout),
      }
    );
    if (result.outcome === "lost-race") return { error: "push_in_progress" };
    garminPushId =
      result.library?.kind === "confirmed" ? result.library.workoutId : null;
  } catch (error) {
    if (error instanceof NoActiveExportRouteError) {
      return { error: "no_active_export_route", message: error.message };
    }
    return { error: "push_failed" };
  }

  if (garminPushId === null) return { workoutId: record.id, garminPushId };
  // Re-read before persisting so edits made while the push was in flight
  // are not overwritten by the stale copy captured above.
  const fresh = await persistence.workouts.getById(workoutId);
  await persistence.workouts.put(
    recordGarminPush(fresh ?? record, garminPushId)
  );
  return { workoutId: record.id, garminPushId };
};
