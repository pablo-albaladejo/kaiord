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
  REPEAT_UNTIL_HR_GREATER_THAN: "repeatUntilHrGreaterThan",
  HR_LESS_THAN: "hrLessThan",
  HR_GREATER_THAN: "hrGreaterThan",
  OPEN: "open",
} as const;

export const FIT_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heartRate",
  CADENCE: "cadence",
  SPEED: "speed",
  STROKE_TYPE: "swimStroke",
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

// KRD target types (domain model)
export const KRD_TARGET_TYPE = {
  POWER: "power",
  HEART_RATE: "heart_rate",
  CADENCE: "cadence",
  PACE: "pace",
  STROKE_TYPE: "stroke_type",
  OPEN: "open",
} as const;

// KRD target value units (domain model)
export const KRD_TARGET_UNIT = {
  ZONE: "zone",
  RANGE: "range",
  WATTS: "watts",
  PERCENT_FTP: "percent_ftp",
  BPM: "bpm",
  PERCENT_MAX: "percent_max",
  RPM: "rpm",
  SPM: "spm",
  MPS: "mps",
  MIN_PER_KM: "min_per_km",
  SWIM_STROKE: "swim_stroke",
} as const;

// FIT swim stroke types
export const FIT_SWIM_STROKE = {
  FREESTYLE: 0,
  BACKSTROKE: 1,
  BREASTSTROKE: 2,
  BUTTERFLY: 3,
  DRILL: 4,
  MIXED: 5,
  IM: 5,
} as const;

// KRD file types
export const KRD_FILE_TYPE = {
  WORKOUT: "workout",
  ACTIVITY: "activity",
  COURSE: "course",
} as const;

// KRD version
export const KRD_VERSION = "1.0" as const;

// FIT file types
export const FIT_FILE_TYPE = {
  WORKOUT: "workout",
  ACTIVITY: "activity",
  COURSE: "course",
} as const;

// Default values
export const DEFAULT_SPORT = FIT_SPORT_TYPE.CYCLING;
export const DEFAULT_MANUFACTURER = "development" as const;

// FIT intensity types
export const FIT_INTENSITY = {
  ACTIVE: "active",
  REST: "rest",
  WARMUP: "warmup",
  COOLDOWN: "cooldown",
  RECOVERY: "recovery",
  INTERVAL: "interval",
  OTHER: "other",
} as const;

// Type guard property names
export const TYPE_GUARD_PROPERTY = {
  REPEAT_COUNT: "repeatCount",
  STEP_INDEX: "stepIndex",
} as const;
