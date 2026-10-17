import type { Translate } from "../../../i18n/use-translate";

/** What a summary needs to word an action in the active locale. */
export type SummaryContext = {
  t: Translate;
  dataTypeLabel: (dataType: string) => string;
  formatDay: (day: string) => string;
};

/** A tool call's input as the model sent it, before any schema parse. */
export type ActionInput = Record<string, unknown>;

export const text = (input: ActionInput, key: string): string | undefined => {
  const value = input[key];
  return typeof value === "string" && value !== "" ? value : undefined;
};

export const num = (input: ActionInput, key: string): number | undefined => {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "16 oct" / "Oct 16"; a value that is not a calendar day is shown as sent. */
export const formatShortDay = (day: string, locale: string): string =>
  DAY_PATTERN.test(day) && !Number.isNaN(Date.parse(`${day}T12:00:00Z`))
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${day}T12:00:00Z`))
    : day;
