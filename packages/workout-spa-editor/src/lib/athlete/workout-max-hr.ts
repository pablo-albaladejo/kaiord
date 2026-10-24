import { MissingMaxHeartRateError } from "@kaiord/core";

import { MaxHrUnavailableError } from "../../types/max-hr-unavailable-error";
import type { Profile } from "../../types/profile";

/** The profile's max heart rate, used to resolve `percent_max` heart-rate
    targets when exporting to formats that store bpm (Garmin). It is the
    profile's cross-sport ceiling, so the workout's sport does not matter.
    `undefined` without a profile or a max HR — the writer then refuses
    instead of guessing. */
export const maxHrForWorkout = (
  profile: Profile | null | undefined
): number | undefined => profile?.maxHeartRate;

/** Runs a bpm-only write, turning its MissingMaxHeartRateError into a
    MaxHrUnavailableError that names the fix. */
export const refuseMissingMaxHr = async <T>(
  write: () => Promise<T>
): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (!(error instanceof MissingMaxHeartRateError)) throw error;
    throw new MaxHrUnavailableError("missing-max-hr");
  }
};
