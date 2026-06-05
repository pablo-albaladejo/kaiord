/**
 * Calendar week view, the editor's home page. All orchestration lives
 * in `useCalendarPage` (data plumbing) and `CalendarPageView` (render).
 * This file is a thin adapter from the hook's discriminated `state` to
 * either a `Redirect`, a skeleton, or the populated view.
 */

import { Redirect } from "wouter";

import { getCurrentWeekId } from "../../utils/week-utils";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { CalendarPageView } from "./CalendarPageView";
import { useCalendarPage } from "./use-calendar-page";

export default function CalendarPage() {
  const result = useCalendarPage();
  // Invalid week ids retarget the CONCRETE current week (1-hop — bare
  // /calendar is itself a redirect since the /today split).
  if (result.state === "redirect")
    return <Redirect to={`/calendar/${getCurrentWeekId()}`} replace />;
  if (result.state === "skeleton") return <CalendarSkeleton />;
  return <CalendarPageView {...result} />;
}
