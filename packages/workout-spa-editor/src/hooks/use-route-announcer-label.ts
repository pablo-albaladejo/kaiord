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
 * Disambiguation: each label is suffixed with " page" / equivalent
 * so it does NOT collide with the page's `<h1>` text. Without the
 * suffix, screen readers would read both ("Library Library") when
 * focus moves to the heading after navigation.
 */

import { useLocation } from "wouter";

import { useTranslate } from "../i18n/use-translate";

export function useRouteAnnouncerLabel(): string {
  const [pathname] = useLocation();
  const t = useTranslate("nav");
  return t(`announce.${announceKey(pathname)}`);
}

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const EXACT: Record<string, string> = {
  "/library": "library",
  "/chat": "chat",
  "/athlete": "athlete",
  "/workout/new": "newWorkout",
  "/health": "trends",
  "/health/sleep": "sleep",
  "/health/weight": "weight",
  "/health/recovery": "recovery",
  "/health/activity": "activity",
  "/nutrition": "nutrition",
  "/daily": "daily",
};

function announceKey(rawPathname: string): string {
  const pathname = normalizePath(rawPathname);
  const exact = EXACT[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/workout/view/")) return "workout";
  if (pathname.startsWith("/workout/")) return "editWorkout";
  if (pathname.startsWith("/settings")) return "settings";
  return "calendar";
}
