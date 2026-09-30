import { MissingFtpError } from "@kaiord/core";

import { FtpUnavailableError } from "../../types/ftp-unavailable-error";
import type { KRD } from "../../types/krd";
import type { Profile } from "../../types/profile";
import { SPORT_ZONE_CAPABILITIES } from "../../types/sport-zones";
import { getStructuredWorkout } from "../../utils/structured-workout";
import { thresholdsForSport } from "./threshold-for-sport";

const workoutSport = (krd: KRD): string | undefined =>
  getStructuredWorkout(krd)?.sport ?? krd.metadata?.sport;

/** The profile's FTP for the workout's sport, used to resolve `percent_ftp`
    power targets when exporting to formats that store watts (Garmin).
    `undefined` when the profile, the sport or its FTP is missing — the
    writer then refuses instead of guessing. */
export function ftpForWorkout(
  profile: Profile | null | undefined,
  krd: KRD
): number | undefined {
  const sport = workoutSport(krd);
  if (!profile?.sportZones || !sport) return undefined;
  return thresholdsForSport(profile, sport).ftp;
}

/** Why a %FTP workout got no FTP. `sport-without-power`: its sport (generic,
    fitness_equipment, swimming, none…) has no power zones, so no profile
    FTP can ever apply and "set your FTP" would be the wrong advice.
    `no-ftp`: the sport has power zones but the profile holds no FTP. */
export type MissingFtpReason = "no-ftp" | "sport-without-power";

export function missingFtpReason(krd: KRD): MissingFtpReason {
  const sport = workoutSport(krd);
  const holdsPower =
    sport !== undefined &&
    Object.hasOwn(SPORT_ZONE_CAPABILITIES, sport) &&
    SPORT_ZONE_CAPABILITIES[sport as keyof typeof SPORT_ZONE_CAPABILITIES]
      .power;
  return holdsPower ? "no-ftp" : "sport-without-power";
}

/** Runs a watts-only write, turning its MissingFtpError into an
    FtpUnavailableError that names the fix for this workout. */
export const refuseMissingFtp = async <T>(
  krd: KRD,
  write: () => Promise<T>
): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (!(error instanceof MissingFtpError)) throw error;
    throw new FtpUnavailableError(
      missingFtpReason(krd) === "no-ftp"
        ? "missing-ftp"
        : "sport-without-power-zones"
    );
  }
};
