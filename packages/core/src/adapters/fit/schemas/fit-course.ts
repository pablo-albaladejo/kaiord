import { z } from "zod";

/**
 * FIT course message schema
 *
 * Represents a route or course that can be followed during a workout.
 * Contains basic course information like name, sport, and capabilities.
 *
 * @see https://developer.garmin.com/fit/file-types/course/
 */
export const fitCourseSchema = z.object({
  name: z.string().optional(),
  capabilities: z.number().optional(),
  sport: z.string().optional(),
  subSport: z.string().optional(),
});

/**
 * TypeScript type for FIT course
 */
export type FitCourse = z.infer<typeof fitCourseSchema>;
