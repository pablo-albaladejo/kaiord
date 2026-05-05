/**
 * Calendar week view, the editor's home page. All orchestration lives
 * in `useCalendarPage` (data plumbing) and `CalendarPageView` (render).
 * This file is a thin adapter from the hook's discriminated `state` to
 * either a `Redirect`, a skeleton, or the populated view.
 */

import { Redirect } from "wouter";

import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { CalendarPageView } from "./CalendarPageView";
import { useCalendarPage } from "./use-calendar-page";

export default function CalendarPage() {
  const result = useCalendarPage();
  if (result.state === "redirect") return <Redirect to="/calendar" />;
  if (result.state === "skeleton") return <CalendarSkeleton />;
  return <CalendarPageView {...result} />;
}
