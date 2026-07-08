/**
 * Format an ISO date string (YYYY-MM-DD) as a long human-readable
 * label for the picker's accessible name (e.g. "Monday, May 4").
 *
 * The picker dialog's accessible name MUST include the date (per spec
 * scenario "Calendar in-flow template selection uses a narrow picker
 * dialog") so screen-reader users hear the cell context the dialog
 * is bound to.
 */
import type { Locale } from "@kaiord/i18n";

export function formatDateLabel(date: string, locale: Locale = "en"): string {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
