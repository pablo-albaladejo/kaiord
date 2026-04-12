/**
 * Workout Record Schema
 *
 * Full workout record combining all fragment schemas.
 */

import { z } from "zod";

import { workoutStateSchema } from "./calendar-enums";
import {
  aiMetaSchema,
  workoutFeedbackSchema,
  workoutRawSchema,
} from "./calendar-fragments";
import { krdSchema } from "./schemas";

export const workoutRecordSchema = z.object({
  id: z.uuid(),
  date: z.iso.date(),
  sport: z.string(),
  source: z.string(),
  sourceId: z.string().nullable(),
  planId: z.string().nullable(),
  state: workoutStateSchema,
  raw: workoutRawSchema.nullable(),
  krd: krdSchema.nullable(),
  lastProcessingError: z.string().nullable(),
  feedback: workoutFeedbackSchema.nullable(),
  aiMeta: aiMetaSchema.nullable(),
  garminPushId: z.string().nullable(),
  tags: z.array(z.string()),
  previousState: workoutStateSchema.nullable(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export type WorkoutRecord = z.infer<typeof workoutRecordSchema>;
