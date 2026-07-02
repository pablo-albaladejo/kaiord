/**
 * Pure resolver mapping a parsed back-origin to an in-app href.
 *
 * Always returns a known SPA surface — never `history.back()` — so a
 * deep-link landing can never walk off the app. Null/unknown origin
 * degrades to the calendar home (the app's default view). `week` pins
 * calendar-origin targets to the originating `/calendar/:weekId`; without
 * it, bare `/calendar` lands on the current week via the route-level
 * redirect. `coaching` writers pass no week by design.
 */

import type { BackOrigin } from "./back-origin";
import { buildPickerHref } from "./picker-href";

const DEFAULT_TARGET = "/calendar";

export type ResolveBackInput = {
  origin: BackOrigin | null;
  date?: string | null;
  detailId?: string | null;
  week?: string | null;
};

export function resolveBackTarget({
  origin,
  date,
  detailId,
  week,
}: ResolveBackInput): string {
  switch (origin) {
    case "library":
      return "/library";
    case "detail":
      return detailId ? `/workout/view/${detailId}` : DEFAULT_TARGET;
    case "calendar-day":
      return date ? buildPickerHref(date) : DEFAULT_TARGET;
    case "calendar":
      return week ? `/calendar/${week}` : "/calendar";
    case "coaching":
      return "/calendar";
    case "daily":
      return date ? `/daily?date=${date}` : "/daily";
    case "chat":
      return "/chat";
    default:
      return DEFAULT_TARGET;
  }
}
