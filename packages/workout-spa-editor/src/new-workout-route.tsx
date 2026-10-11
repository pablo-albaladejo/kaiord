import { useLocation, useSearch } from "wouter";

import { CreateWorkout, EditorPage } from "./lazy-pages";
import { calendarWeekHref } from "./routing/calendar-week-href";
import { sheetCloseHref } from "./routing/new-session-href";

/**
 * Dispatches `/workout/new`: the import/scratch query params open the editor
 * directly; otherwise the AI Create overlay is shown.
 *
 * `onClose` leaves the sheet for the surface it was opened from: the
 * calendar week holding `?date=` / `?week=`, or the `?from=` origin.
 *
 * `onSaved` lands on the calendar week containing the saved record so the
 * new workout is visible on arrival.
 */
export function NewWorkoutRoute() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const hasAction = params.get("action") === "import";
  const hasSource = params.get("source") === "scratch";
  const hasCoachingDraft = params.get("coaching") !== null;
  if (hasAction || hasSource || hasCoachingDraft) return <EditorPage />;
  const closeTarget = sheetCloseHref({
    date: params.get("date"),
    week: params.get("week"),
    from: params.get("from"),
  });
  return (
    <CreateWorkout
      onClose={() => navigate(closeTarget)}
      onSaved={(savedDate) => navigate(calendarWeekHref(savedDate))}
    />
  );
}
