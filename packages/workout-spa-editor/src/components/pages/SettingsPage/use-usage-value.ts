/**
 * Value rendered on the Settings index "Usage" row: the current month's token
 * total, e.g. "1.2M tokens · July". Shares `useUsageSummary` with the Usage
 * tab so both surfaces fold the same events; renders nothing while the query
 * resolves or when the month has no usage.
 */

import { foldUsageEvents } from "../../../application/usage/fold-usage-events";
import { useUsageSummary } from "../../../hooks/use-usage-summary";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";

const CURRENT_MONTH_ONLY = 1;
const MAX_FRACTION_DIGITS = 1;

const compactTokens = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: MAX_FRACTION_DIGITS,
  }).format(value);

const monthName = (yearMonth: string, locale: string): string => {
  const [year, month] = yearMonth.split("-").map(Number);
  if (year === undefined || month === undefined) return yearMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(locale, {
    month: "long",
    timeZone: "UTC",
  });
};

export const useUsageValue = (): string | undefined => {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  const { months, events } = useUsageSummary(CURRENT_MONTH_ONLY);
  const yearMonth = months[0];

  if (events === undefined || yearMonth === undefined) return undefined;
  const { totalTokens } = foldUsageEvents(events);
  if (totalTokens === 0) return undefined;
  return t("values.usage.tokens", {
    tokens: compactTokens(totalTokens, locale),
    month: monthName(yearMonth, locale),
  });
};
