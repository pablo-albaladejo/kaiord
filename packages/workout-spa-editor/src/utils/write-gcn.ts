import { type KRD, toText } from "@kaiord/core";

import { ftpForWorkout, refuseMissingFtp } from "../lib/athlete/workout-ftp";
import {
  maxHrForWorkout,
  refuseMissingMaxHr,
} from "../lib/athlete/workout-max-hr";
import type { Profile } from "../types/profile";
import { garminPaceZonesFor } from "./garmin-pace-zones";

/**
 * The one GCN writer every Garmin payload goes through (single push, Send
 * week, chat, file export): pace zone, %FTP power and %max HR heart-rate
 * targets resolved from `profile`. Any it cannot resolve is refused, never
 * guessed.
 */
export const writeGcn = async (
  krd: KRD,
  profile: Profile | null | undefined
): Promise<string> => {
  const paceZones = garminPaceZonesFor(krd, profile);
  const ftpWatts = ftpForWorkout(profile, krd);
  const maxHeartRate = maxHrForWorkout(profile);
  const { createGarminWriter } = await import("@kaiord/garmin");
  const writer = createGarminWriter({ paceZones, ftpWatts, maxHeartRate });
  return refuseMissingMaxHr(() =>
    refuseMissingFtp(krd, () => toText(krd, writer))
  );
};
