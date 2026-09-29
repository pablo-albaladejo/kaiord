/**
 * A workout's GCN for the placement pipeline, exported with its owner's
 * FTP so %FTP power targets reach Garmin as watts. Without a usable FTP
 * the workout stops here with a placement failure, before any push.
 */
import { MissingFtpError } from "@kaiord/core";

import {
  failed,
  type PlacementResult,
} from "../application/garmin-placement/placement-result";
import { ftpForWorkout, missingFtpReason } from "../lib/athlete";
import type { PersistencePort } from "../ports/persistence-port";
import type { KRD } from "../types/krd";
import { exportGcnWorkout } from "../utils/export-workout-formats";

/** Why a %FTP workout with no FTP was stopped before reaching Garmin. */
export const missingFtpPlacement = (krd: KRD): PlacementResult =>
  failed(
    missingFtpReason(krd) === "no-ftp"
      ? "missing-ftp"
      : "sport-without-power-zones",
    false
  );

/** The record's GCN with its owner's FTP, or the failure that stops a
    %FTP workout without one before anything reaches Garmin. */
export const exportForPlacement = async (
  persistence: PersistencePort,
  profileId: string,
  krd: KRD
): Promise<{ gcn: unknown } | { failure: PlacementResult }> => {
  const profile = await persistence.profiles.getById(profileId);
  try {
    return { gcn: await exportGcnWorkout(krd, ftpForWorkout(profile, krd)) };
  } catch (error) {
    if (!(error instanceof MissingFtpError)) throw error;
    return { failure: missingFtpPlacement(krd) };
  }
};
