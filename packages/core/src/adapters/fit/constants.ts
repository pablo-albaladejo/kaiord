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

// KRD mapped values (our internal format)
export const KRD_DURATION_TYPE = {
  TIME: "time",
  DISTANCE: "distance",
  OPEN: "open",
} as const;

export const KRD_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heart_rate",
  CADENCE: "cadence",
  PACE: "pace",
  OPEN: "open",
} as const;

export const KRD_TARGET_UNIT = {
  ZONE: "zone",
  WATTS: "watts",
  PERCENT_FTP: "percent_ftp",
  BPM: "bpm",
  PERCENT_MAX: "percent_max",
  RPM: "rpm",
  MPS: "mps",
  RANGE: "range",
} as const;

// FIT message property names (from Garmin SDK)
export const FIT_MESSAGE_KEY = {
  FILE_ID: "fileIdMesgs",
  WORKOUT: "workoutMesgs",
  WORKOUT_STEP: "workoutStepMesgs",
} as const;

// Type helpers - derive types from constants
export type KRDDurationType =
  (typeof KRD_DURATION_TYPE)[keyof typeof KRD_DURATION_TYPE];
export type KRDTargetType =
  (typeof KRD_TARGET_TYPE)[keyof typeof KRD_TARGET_TYPE];
export type KRDTargetUnit =
  (typeof KRD_TARGET_UNIT)[keyof typeof KRD_TARGET_UNIT];

// Default values
export const DEFAULT_SPORT = FIT_SPORT_TYPE.CYCLING;
