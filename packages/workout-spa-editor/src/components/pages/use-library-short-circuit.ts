/**
 * Reads the LibraryPage URL params (`?source=` + `?date=`) and returns
 * a short-circuit date when entered from the new-workout picker with a
 * valid ISO date. Pairs with `usePickerSchedule` in `LibraryPage` to
 * bypass `ScheduleDateDialog` on a single template-card click.
 *
 * Invalid or absent `?date=`, or a different `?source=`, returns `null`
 * so the explicit dialog flow remains the default.
 */

import { useSearch } from "wouter";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TEMPLATE_PICKER_SOURCE = "template-picker";

export function useLibraryShortCircuitDate(): string | null {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const source = params.get("source");
  const dateParam = params.get("date");
  if (source !== TEMPLATE_PICKER_SOURCE) return null;
  if (dateParam === null || !ISO_DATE_REGEX.test(dateParam)) return null;
  return dateParam;
}
