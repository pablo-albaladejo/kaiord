/**
 * useRouteAnnouncerLabel — derive a human-readable label for the
 * current wouter pathname so a single `aria-live="polite"` region
 * can announce route changes to screen readers.
 *
 * Returns a non-empty label on initial mount so deep-linked first-
 * loads produce one SR announcement (per spec scenario "Initial
 * mount announces the current route"). Pure pathname mapping;
 * query-string changes are ignored at the hook boundary because
 * `useLocation()` returns the path without the search component.
 *
 * Localisation: labels are English-only, consistent with the rest
 * of the SPA copy today. If the project later adopts an i18n
 * framework, wrap each return value in `t(...)`.
 *
 * Disambiguation: each label is suffixed with " page" / equivalent
 * so it does NOT collide with the page's `<h1>` text. Without the
 * suffix, screen readers would read both ("Library Library") when
 * focus moves to the heading after navigation.
 */

import { useLocation } from "wouter";

export function useRouteAnnouncerLabel(): string {
  const [pathname] = useLocation();
  return labelForPathname(pathname);
}

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function labelForPathname(rawPathname: string): string {
  const pathname = normalizePath(rawPathname);
  if (pathname === "/library") return "Library page";
  if (pathname === "/athlete") return "Athlete page";
  if (pathname === "/workout/new") return "New workout";
  if (pathname.startsWith("/workout/view/")) return "Workout page";
  if (pathname.startsWith("/workout/")) return "Edit workout";
  if (pathname === "/health") return "Trends page";
  if (pathname === "/health/sleep") return "Sleep page";
  if (pathname === "/health/weight") return "Weight page";
  if (pathname === "/health/recovery") return "Recovery page";
  if (pathname === "/health/activity") return "Activity page";
  if (pathname.startsWith("/settings")) return "Settings page";
  if (pathname === "/" || pathname.startsWith("/calendar"))
    return "Calendar page";
  return "Calendar page";
}
