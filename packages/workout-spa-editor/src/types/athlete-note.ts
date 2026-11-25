/**
 * Athlete note — what the athlete adds to a Coaching Activity for the
 * assistant to read alongside the coach's text (GLOSSARY.md). One row per
 * Coaching Activity in its own store, keyed by the activity's composite id,
 * so a coach re-sync that rewrites the activity row never touches it. It
 * rides the Drive snapshot (merged per row by `updatedAt`) and the backup;
 * it is never sent to Train2Go. A cleared note keeps its row with `text: ""`,
 * so the clearing travels like any other edit.
 */
import { z } from "zod";

export const athleteNoteSchema = z.object({
  /** The Coaching Activity's composite id (`${profileId}:${source}:${sourceId}`). */
  id: z.string().min(1),
  profileId: z.string().min(1),
  text: z.string(),
  updatedAt: z.iso.datetime(),
});

export type AthleteNote = z.infer<typeof athleteNoteSchema>;
