import { useActiveLocale } from "../../i18n/LocaleProvider";
import { shortDate } from "./calendar-day-labels";

/**
 * The athlete's most recent session as a readable date, for the copy that
 * names it. Undefined when there is no session anywhere — the banner then
 * drops the date and the "go to it" action along with it, rather than
 * printing an empty one.
 */
export function useLatestSessionDate(
  iso: string | undefined
): string | undefined {
  const locale = useActiveLocale();
  return iso === undefined ? undefined : shortDate(iso, locale);
}
