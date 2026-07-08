/**
 * Pure, dictionary-backed translator for a namespace. Reads the active locale
 * from `useActiveLocale` (which defaults to English outside a `LocaleProvider`,
 * so the thousands of component tests that render unwrapped stay in `en` and
 * their English assertions keep passing). Resolves a dotted key against the
 * active locale, falls back to the English value, then to the key itself; no
 * react-i18next dependency, so no `I18nextProvider` is required to render.
 *
 * This is the seam used to migrate hardcoded UI strings: replace a literal
 * with `t("key")` and add the English value verbatim to the namespace JSON so
 * `en`-mode output is byte-identical.
 */
import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";

import { useActiveLocale } from "./LocaleProvider";
import { resources } from "./resources";

type TranslateParams = Record<string, string | number>;

const lookup = (
  locale: Locale,
  ns: string,
  key: string
): string | undefined => {
  const namespaces = resources[locale] ?? resources[DEFAULT_LOCALE];
  let current: unknown = namespaces[ns];
  for (const segment of key.split(".")) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
};

const interpolate = (value: string, params?: TranslateParams): string =>
  params === undefined
    ? value
    : value.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
        key in params ? String(params[key]) : `{{${key}}}`
      );

export type Translate = (key: string, params?: TranslateParams) => string;

export function useTranslate(ns: string): Translate {
  const locale = useActiveLocale();
  return (key, params) =>
    interpolate(
      lookup(locale, ns, key) ?? lookup(DEFAULT_LOCALE, ns, key) ?? key,
      params
    );
}
