/**
 * Add, edit or clear the Athlete note of a Coaching Activity. The coach's
 * text is never touched: the note lives in its own row. Clearing keeps the
 * row with empty text, stamped newer, so the clearing reaches every device.
 */
import type { AthleteNoteRepository } from "../../ports/athlete-note-repository";

export type SetAthleteNoteDeps = {
  athleteNotes: Pick<AthleteNoteRepository, "put">;
  clock: () => string;
};

export type SetAthleteNoteInput = {
  profileId: string;
  /** The Coaching Activity's composite id. */
  coachingActivityId: string;
  text: string;
};

export const setAthleteNote = (
  deps: SetAthleteNoteDeps,
  input: SetAthleteNoteInput
): Promise<void> =>
  deps.athleteNotes.put({
    id: input.coachingActivityId,
    profileId: input.profileId,
    text: input.text.trim(),
    updatedAt: deps.clock(),
  });
