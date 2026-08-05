/**
 * `useTranslate` is a dictionary lookup, not i18next: it does not resolve
 * `_one` / `_other` suffixes on its own. Callers that render a counted string
 * pick the suffix, and this is that choice in one place so the two forms are
 * never selected by two different rules.
 *
 * Both shipped locales (en, es) use the same one/other split.
 */
export const pluralKey = (base: string, count: number): string =>
  `${base}_${count === 1 ? "one" : "other"}`;
