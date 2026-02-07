import { z } from "zod";

/**
 * FIT event types (what kind of event occurred).
 */
export const fitEventSchema = z.enum([
  "timer",
  "workout",
  "workoutStep",
  "powerDown",
  "powerUp",
  "offCourse",
  "session",
  "lap",
  "coursePoint",
  "battery",
  "virtualPartnerPace",
  "hrHighAlert",
  "hrLowAlert",
  "speedHighAlert",
  "speedLowAlert",
  "cadHighAlert",
  "cadLowAlert",
  "powerHighAlert",
  "powerLowAlert",
  "recoveryHr",
  "batteryLow",
  "timeDurationAlert",
  "distanceDurationAlert",
  "calorieDurationAlert",
  "activity",
  "fitnessEquipment",
  "length",
  "userMarker",
  "sportPoint",
  "calibration",
  "frontGearChange",
  "rearGearChange",
  "riderPositionChange",
  "elevHighAlert",
  "elevLowAlert",
]);

export type FitEvent = z.infer<typeof fitEventSchema>;

/**
 * FIT event type (start, stop, marker, etc.).
 */
export const fitEventTypeSchema = z.enum([
  "start",
  "stop",
  "consecutiveDepreciated",
  "marker",
  "stopAll",
  "beginDepreciated",
  "endDepreciated",
  "endAllDepreciated",
  "stopDisable",
  "stopDisableAll",
]);

export type FitEventType = z.infer<typeof fitEventTypeSchema>;

/**
 * FIT EVENT message schema (Message ID: 21).
 *
 * Captures workout events like start, stop, pause, markers.
 */
export const fitEventMessageSchema = z.object({
  timestamp: z.number(),
  event: fitEventSchema,
  eventType: fitEventTypeSchema,
  eventGroup: z.number().optional(),
  data: z.number().optional(),
  data16: z.number().optional(),
});

export type FitEventMessage = z.infer<typeof fitEventMessageSchema>;
