/**
 * Pure resolver mapping a parsed back-origin to an in-app href.
 *
 * Always returns a known SPA surface — never `history.back()` — so a
 * deep-link landing can never walk off the app. Null/unknown origin
 * degrades to the calendar home.
 */

import type { BackOrigin } from "./back-origin";
import { buildPickerHref } from "./picker-href";

const DEFAULT_TARGET = "/calendar";

export type ResolveBackInput = {
  origin: BackOrigin | null;
  date?: string | null;
  detailId?: string | null;
};

export function resolveBackTarget({
  origin,
  date,
  detailId,
}: ResolveBackInput): string {
  switch (origin) {
    case "library":
      return "/library";
    case "detail":
      return detailId ? `/workout/view/${detailId}` : DEFAULT_TARGET;
    case "calendar-day":
      return date ? buildPickerHref(date) : DEFAULT_TARGET;
    case "calendar":
    case "coaching":
    case "today":
      return DEFAULT_TARGET;
    default:
      return DEFAULT_TARGET;
  }
}
