import { useLocation, useSearch } from "wouter";

import { CreateWorkout, EditorPage } from "./lazy-pages";
import { calendarWeekHref } from "./routing/calendar-week-href";
import { buildPickerHref } from "./routing/picker-href";

/**
 * Dispatches `/workout/new`: the import/scratch query params open the editor
 * directly; otherwise the AI Create overlay is shown.
 *
 * `onClose` is context-aware (#5): when the route carries a `?date=` (entered
 * from a dated calendar day) it returns to the dated picker so the date is
 * preserved; otherwise it falls back to the calendar home.
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
  if (hasAction || hasSource) return <EditorPage />;
  const date = params.get("date");
  const closeTarget = date ? buildPickerHref(date) : "/today";
  return (
    <CreateWorkout
      onClose={() => navigate(closeTarget)}
      onSaved={(savedDate) => navigate(calendarWeekHref(savedDate))}
    />
  );
}
