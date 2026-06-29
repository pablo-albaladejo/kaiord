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
  type WorkoutRaw,
  workoutRawSchema,
} from "./calendar-fragments";
import type { KRD } from "./krd";
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

export type StructuredWorkoutRecordInput = {
  profileId: string;
  date: string;
  sport: string;
  source: string;
  krd: KRD;
  tags: ReadonlyArray<string>;
  raw: WorkoutRaw | null;
};

/**
 * Build a fresh `state: "structured"` WorkoutRecord with the standard
 * null-initialised lifecycle fields. Every structured-workout writer
 * (import, scratch, AI generation, template scheduling) funnels through
 * here so the record shape stays single-sourced.
 */
export const createStructuredWorkoutRecord = (
  input: StructuredWorkoutRecordInput
): WorkoutRecord => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    source: input.source,
    sourceId: null,
    planId: null,
    state: "structured",
    raw: input.raw,
    krd: input.krd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [...input.tags],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
  };
};
