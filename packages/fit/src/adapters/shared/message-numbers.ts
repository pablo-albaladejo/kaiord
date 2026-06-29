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
