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
  // profileId scopes each workout to exactly one user profile. Added in
  // Dexie v13; backfilled from `meta.activeProfileId` for legacy rows.
  // Every writer MUST set this from the active profile at write time.
  profileId: z.string().min(1),
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
