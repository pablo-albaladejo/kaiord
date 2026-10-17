import type { Translate } from "../../../i18n/use-translate";

/** What a summary needs to word an action in the active locale. */
export type SummaryContext = {
  t: Translate;
  /** null when the value is not one the app has a label for. */
  dataTypeLabel: (dataType: string) => string | null;
  sportLabel: (sport: string) => string | null;
  formatDay: (day: string) => string | null;
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

/** A translation, or null when the catalog has no such key (the translator
 * echoes the key back). */
export const labelOf = (t: Translate, key: string): string | null => {
  const label = t(key);
  return label === key ? null : label;
};

/** The `workoutId` of a push_to_garmin input, or "" when it has none. */
export const pushWorkoutId = (input: unknown): string =>
  input !== null && typeof input === "object"
    ? (text(input as ActionInput, "workoutId") ?? "")
    : "";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "16 oct" / "Oct 16", or null for anything that is not a real calendar
 * day: `Date` rolls 2026-02-31 over to March 3, so the parsed day must
 * round-trip to the input. */
export const formatShortDay = (day: string, locale: string): string | null => {
  if (!DAY_PATTERN.test(day)) return null;
  const date = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== day) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
};
