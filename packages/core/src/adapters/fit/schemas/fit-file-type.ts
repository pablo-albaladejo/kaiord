import { z } from "zod";

/**
 * FIT file type enum schema
 *
 * Defines the type of data contained in the FIT file.
 * Used in FILE_ID message to identify file purpose.
 *
 * @see https://developer.garmin.com/fit/file-types/
 */
export const fitFileTypeSchema = z.enum([
  "device",
  "settings",
  "sport",
  "activity",
  "workout",
  "course",
  "schedules",
  "weight",
  "totals",
  "goals",
  "bloodPressure",
  "monitoringA",
  "activitySummary",
  "monitoringDaily",
  "monitoringB",
  "segment",
  "segmentList",
  "exdConfiguration",
]);

/**
 * TypeScript type for FIT file type
 */
export type FitFileType = z.infer<typeof fitFileTypeSchema>;

/**
 * Bidirectional mapping: FIT file type → numeric value
 *
 * Maps string file type to FIT protocol numeric values.
 */
export const FIT_FILE_TYPE_TO_NUMBER: Record<FitFileType, number> = {
  device: 1,
  settings: 2,
  sport: 3,
  activity: 4,
  workout: 5,
  course: 6,
  schedules: 7,
  weight: 9,
  totals: 10,
  goals: 11,
  bloodPressure: 14,
  monitoringA: 15,
  activitySummary: 20,
  monitoringDaily: 28,
  monitoringB: 32,
  segment: 34,
  segmentList: 35,
  exdConfiguration: 40,
};

/**
 * Bidirectional mapping: numeric value → FIT file type
 *
 * Maps FIT protocol numeric values to string file type.
 */
export const NUMBER_TO_FIT_FILE_TYPE: Record<number, FitFileType> = {
  1: "device",
  2: "settings",
  3: "sport",
  4: "activity",
  5: "workout",
  6: "course",
  7: "schedules",
  9: "weight",
  10: "totals",
  11: "goals",
  14: "bloodPressure",
  15: "monitoringA",
  20: "activitySummary",
  28: "monitoringDaily",
  32: "monitoringB",
  34: "segment",
  35: "segmentList",
  40: "exdConfiguration",
};
