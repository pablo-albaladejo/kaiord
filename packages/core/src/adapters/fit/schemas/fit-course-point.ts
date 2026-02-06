import { z } from "zod";

/**
 * FIT course point type enum
 *
 * Defines types of points along a course route such as turns,
 * summits, aid stations, and segment markers.
 */
export const fitCoursePointTypeSchema = z.enum([
  "generic",
  "summit",
  "valley",
  "water",
  "food",
  "danger",
  "left",
  "right",
  "straight",
  "firstAid",
  "fourthCategory",
  "thirdCategory",
  "secondCategory",
  "firstCategory",
  "horsCategory",
  "sprint",
  "leftFork",
  "rightFork",
  "middleFork",
  "slightLeft",
  "sharpLeft",
  "slightRight",
  "sharpRight",
  "uTurn",
  "segmentStart",
  "segmentEnd",
]);

/**
 * TypeScript type for FIT course point type
 */
export type FitCoursePointType = z.infer<typeof fitCoursePointTypeSchema>;

/**
 * FIT course point message schema
 *
 * Represents a point of interest along a course route.
 * Contains location data and metadata about the point.
 */
export const fitCoursePointSchema = z.object({
  messageIndex: z.number().optional(),
  timestamp: z.number().optional(),
  positionLat: z.number(),
  positionLong: z.number(),
  distance: z.number().optional(),
  type: fitCoursePointTypeSchema,
  name: z.string().optional(),
  favorite: z.boolean().optional(),
});

/**
 * TypeScript type for FIT course point
 */
export type FitCoursePoint = z.infer<typeof fitCoursePointSchema>;
