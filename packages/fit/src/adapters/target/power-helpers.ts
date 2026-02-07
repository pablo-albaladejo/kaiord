/**
 * Interprets a workoutPower value from FIT SDK
 * - Values 0-999: Percentage of FTP (direct)
 * - Values >= 1000: Absolute watts (value - 1000)
 */
export const interpretWorkoutPower = (
  value: number
): { type: "watts" | "percentage"; value: number } => {
  if (value >= 1000) {
    return {
      type: "watts",
      value: value - 1000,
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
  if (value > 1000) {
    return {
      unit: "watts" as const,
      value: value - 1000,
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
