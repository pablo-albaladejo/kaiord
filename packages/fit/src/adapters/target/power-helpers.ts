/**
 * FIT `workoutPower` offset (`Profile.types.workoutPower = {1000: wattsOffset}`):
 * absolute watts are stored +1000 so they cannot collide with 0-1000 %FTP.
 * Used by `targetValue`, the custom power range and the power duration and
 * repeat conditions, in both directions.
 */
const WATTS_OFFSET = 1000;

/**
 * Interprets a workoutPower value from FIT SDK
 * - Values 0-999: Percentage of FTP (direct)
 * - Values >= 1000: Absolute watts (value - 1000)
 */
export const interpretWorkoutPower = (
  value: number
): { type: "watts" | "percentage"; value: number } => {
  if (value >= WATTS_OFFSET) {
    return {
      type: "watts",
      value: value - WATTS_OFFSET,
    };
  }
  return {
    type: "percentage",
    value,
  };
};

/**
 * Convert a single power value to KRD target
 * Garmin FIT encoding:
 * - Values > 1000: Absolute watts (offset by 1000)
 * - Values 0-1000: Percentage of FTP
 */
export const convertPowerValue = (value: number) => {
  if (value > WATTS_OFFSET) {
    return {
      unit: "watts" as const,
      value: value - WATTS_OFFSET,
    };
  }

  if (value > 0) {
    return {
      unit: "percent_ftp" as const,
      value,
    };
  }

  return null;
};

/** Encodes absolute watts to their FIT `workoutPower` representation. */
export const encodeWorkoutPower = (watts: number): number =>
  watts + WATTS_OFFSET;
