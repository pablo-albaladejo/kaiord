/**
 * FIT Message Numbers from Garmin FIT SDK Profile.
 * Source: @garmin/fitsdk Profile.MesgNum
 */

export const FIT_MESSAGE_NUMBERS = {
  FILE_ID: 0,
  WORKOUT: 26,
  WORKOUT_STEP: 27,
  // Health domain (KRD v2.0)
  WEIGHT_SCALE: 30,
  BODY_COMPOSITION: 41,
  STRESS_LEVEL: 227,
  MONITORING_INFO: 103,
  MONITORING: 55,
  SLEEP_LEVEL: 275,
  HRV_STATUS_SUMMARY: 370,
  HRV_VALUE: 371,
} as const;

/**
 * FIT file_type values that carry health-domain payloads.
 * Source: @garmin/fitsdk Profile.types.file
 */
export const FIT_HEALTH_FILE_TYPES = {
  WEIGHT: "weight",
  MONITORING_A: "monitoringA",
  MONITORING_DAILY: "monitoringDaily",
  MONITORING_B: "monitoringB",
  SLEEP: "sleep",
} as const;

export type FitHealthFileType =
  (typeof FIT_HEALTH_FILE_TYPES)[keyof typeof FIT_HEALTH_FILE_TYPES];

const HEALTH_FILE_TYPE_VALUES: readonly string[] = Object.values(
  FIT_HEALTH_FILE_TYPES
);

export const isFitHealthFileType = (
  fileType: unknown
): fileType is FitHealthFileType =>
  typeof fileType === "string" && HEALTH_FILE_TYPE_VALUES.includes(fileType);
