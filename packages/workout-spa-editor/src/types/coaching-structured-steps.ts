/**
 * Coaching Structured Steps — the steps table a coach attaches to a
 * Coaching Activity, as read from the Platform, before it is a Workout.
 *
 * Each group is one row of the table: one step, or a work step with its
 * recovery steps, under one repeat count. The zone is the coach's label
 * (e.g. "R1+"), never a zone number. Power is in watts, heart rate in bpm.
 */
import { z } from "zod";

const rangeSchema = z
  .object({ min: z.number().int().min(0), max: z.number().int().min(0) })
  .refine((r) => r.min <= r.max, { message: "min must be <= max" });

export const coachingStructuredStepSchema = z.object({
  durationSeconds: z.number().int().positive(),
  zone: z.string().min(1),
  powerWatts: rangeSchema,
  heartRateBpm: rangeSchema,
});

export const coachingStepGroupSchema = z.object({
  repeat: z.number().int().min(1),
  steps: z.array(coachingStructuredStepSchema).min(1),
});

export const coachingStructuredStepsSchema = z
  .array(coachingStepGroupSchema)
  .min(1);

export type CoachingStructuredStep = z.infer<
  typeof coachingStructuredStepSchema
>;
export type CoachingStepGroup = z.infer<typeof coachingStepGroupSchema>;
/** A power or heart-rate range of one row, `min <= max`. */
export type CoachingStepRange = z.infer<typeof rangeSchema>;
