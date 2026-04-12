/**
 * Calendar Fragment Schemas
 *
 * Reusable sub-schemas for workout records: value with unit,
 * comments, raw payload, feedback, and AI metadata.
 */

import { z } from "zod";

import { conditionSchema } from "./calendar-enums";

export const valueWithUnitSchema = z.object({
  value: z.number(),
  unit: z.string(),
});

export type ValueWithUnit = z.infer<typeof valueWithUnitSchema>;

export const workoutCommentSchema = z.object({
  author: z.string(),
  text: z.string(),
  timestamp: z.iso.datetime(),
});

export type WorkoutComment = z.infer<typeof workoutCommentSchema>;

export const workoutRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  comments: z.array(workoutCommentSchema),
  distance: valueWithUnitSchema.nullable(),
  duration: valueWithUnitSchema.nullable(),
  prescribedRpe: z.number().min(1).max(10).nullable(),
  rawHash: z.string(),
});

export type WorkoutRaw = z.infer<typeof workoutRawSchema>;

export const workoutFeedbackSchema = z.object({
  actualRpe: z.number().min(1).max(10).nullable(),
  completionNotes: z.string().nullable(),
  completedAsPlanned: z.boolean().nullable(),
  actualDuration: valueWithUnitSchema.nullable(),
  actualDistance: valueWithUnitSchema.nullable(),
  conditions: z.array(conditionSchema).nullable(),
  customConditions: z.array(z.string()).nullable(),
});

export type WorkoutFeedback = z.infer<typeof workoutFeedbackSchema>;

export const aiMetaSchema = z.object({
  promptVersion: z.string(),
  model: z.string(),
  provider: z.string(),
  processedAt: z.iso.datetime(),
});

export type AiMeta = z.infer<typeof aiMetaSchema>;
