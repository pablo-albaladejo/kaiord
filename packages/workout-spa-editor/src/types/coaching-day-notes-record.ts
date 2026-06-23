/**
 * CoachingDayNotesRecord — persisted shape for a day-scoped coaching
 * comment thread.
 *
 * Stored in the `coachingDayNotes` Dexie table. Composite primary key
 * `${profileId}:${source}:${date}` mirrors `coachingActivities.id`, with
 * `date` taking the place of `sourceId` — comments belong to the DAY, not
 * to an individual activity (Train2Go's comment form posts a `date`, and
 * the thread renders beside the day's activity list).
 *
 * The thread is replaced wholesale on every `read-day` fetch, so no
 * per-comment identity is tracked. Avatar image URLs are deliberately NOT
 * part of the shape (author name only) — the `.strict()` guard rejects any
 * stray field, including an accidental avatar URL.
 */

import { z } from "zod";

export const coachingDayCommentSchema = z
  .object({
    /** Display name from the comment's avatar `<picture title="...">`. */
    author: z.string(),
    /** True when the linked athlete (not the coach) authored the comment. */
    isOwn: z.boolean(),
    /** Platform timestamp, verbatim from `<time datetime="...">`. */
    timestamp: z.string(),
    /** Plain text; links encoded as markdown `[label](url)`, paragraphs as `\n`. */
    text: z.string(),
  })
  .strict();

export type CoachingDayComment = z.infer<typeof coachingDayCommentSchema>;

export const coachingDayNotesRecordSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    source: z.string().min(1),
    /** YYYY-MM-DD in the user's local timezone (matches calendar week-id convention). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    comments: z.array(coachingDayCommentSchema),
    fetchedAt: z.iso.datetime(),
  })
  .strict()
  .refine((rec) => rec.id === `${rec.profileId}:${rec.source}:${rec.date}`, {
    message: "id must be `${profileId}:${source}:${date}`",
  });

export type CoachingDayNotesRecord = z.infer<
  typeof coachingDayNotesRecordSchema
>;

/** Builds the canonical composite id for a day-notes row. */
export const buildCoachingDayNotesId = (
  profileId: string,
  source: string,
  date: string
): string => `${profileId}:${source}:${date}`;
