import type { KRD } from "../../types/krd";
import type { Profile } from "../../types/profile";
import { getStructuredWorkout } from "../../utils/structured-workout";
import { thresholdsForSport } from "./threshold-for-sport";

/** The profile's FTP for the workout's sport, used to resolve `percent_ftp`
    power targets when exporting to formats that store watts (Garmin).
    `undefined` when the profile, the sport or its FTP is missing — the
    writer then refuses instead of guessing. */
export function ftpForWorkout(
  profile: Profile | null | undefined,
  krd: KRD
): number | undefined {
  const sport = getStructuredWorkout(krd)?.sport ?? krd.metadata?.sport;
  if (!profile?.sportZones || !sport) return undefined;
  return thresholdsForSport(profile, sport).ftp;
}
