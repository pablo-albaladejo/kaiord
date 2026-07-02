/**
 * Builds the chat deep-link that opens the composer pre-filled with an
 * "adjust this session" request. The workout id lets the chat agent look
 * the session up with its query tools; the calendar/detail surfaces stay
 * read-only and delegate the mutation to the conversational action path.
 */
import type { WorkoutRecord } from "../types/calendar-record";

export const adjustWithAiHref = (
  workout: Pick<WorkoutRecord, "id" | "date">
): string => {
  const prompt =
    `Adjust my workout with id ${workout.id}` +
    (workout.date ? ` scheduled on ${workout.date}` : "") +
    ": ";
  return `/chat?prefill=${encodeURIComponent(prompt)}`;
};
