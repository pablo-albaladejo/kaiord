/**
 * FIT Protocol Constants
 * These values are defined by the Garmin FIT SDK and should not be changed.
 * Reference: https://developer.garmin.com/fit/file-types/workout/
 */

// FIT message field values (from Garmin SDK)
export const FIT_DURATION_TYPE = {
  TIME: "time",
  DISTANCE: "distance",
  REPEAT_UNTIL_STEPS_COMPLETE: "repeatUntilStepsCmplt",
  HR_LESS_THAN: "hrLessThan",
  OPEN: "open",
} as const;

export const FIT_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heartRate",
  CADENCE: "cadence",
  SPEED: "speed",
  OPEN: "open",
} as const;

export const FIT_SPORT_TYPE = {
  CYCLING: "cycling",
  RUNNING: "running",
  SWIMMING: "swimming",
  GENERIC: "generic",
} as const;

// FIT message property names (from Garmin SDK)
export const FIT_MESSAGE_KEY = {
  FILE_ID: "fileIdMesgs",
  WORKOUT: "workoutMesgs",
  WORKOUT_STEP: "workoutStepMesgs",
} as const;

// Default values
export const DEFAULT_SPORT = FIT_SPORT_TYPE.CYCLING;
