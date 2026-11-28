/**
 * The text the AI reads to build a Coaching Activity's Workout: the coach's
 * text (or "title (sport)" when it is empty), the steps table when the
 * activity has one, and the Athlete note when there is one. The coach's text
 * is never changed; the note is added after it, labelled as the athlete's.
 */
import type { AthleteNoteRepository } from "../../ports/athlete-note-repository";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";

export const coachText = (activity: CoachingActivityRecord): string =>
  activity.description?.trim()
    ? activity.description
    : `${activity.title} (${activity.sport})`;

export const buildCoachingPromptText = (
  activity: CoachingActivityRecord,
  note: string | undefined,
  tableText?: string
): string =>
  [
    coachText(activity),
    tableText ? `Steps table:\n${tableText}` : undefined,
    note
      ? `Athlete note (the athlete's own words, to apply on top of the coach's text):\n${note}`
      : undefined,
  ]
    .filter((part): part is string => part !== undefined)
    .join("\n\n");

/** The activity's Athlete note, or `undefined` when there is none or it is blank. */
export const readAthleteNoteText = async (
  notes: Pick<AthleteNoteRepository, "getById">,
  coachingActivityId: string
): Promise<string | undefined> => {
  const text = (await notes.getById(coachingActivityId))?.text.trim();
  return text ? text : undefined;
};
