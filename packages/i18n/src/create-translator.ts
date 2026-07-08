import i18next, { type i18n as I18nInstance } from "i18next";

import type { Locale, LocaleResources } from "./types";
import { DEFAULT_LOCALE, isSupportedLocale } from "./types";

export type TranslateParams = Record<string, unknown>;

export type Translator = {
  /** Resolve a `namespace:key.path` (or `key.path`) to a string. */
  t: (key: string, params?: TranslateParams) => string;
  /** The active, already-resolved locale. */
  locale: Locale;
  /** Underlying i18next instance (for react-i18next or advanced consumers). */
  instance: I18nInstance;
};

export type CreateTranslatorInput = {
  /** Requested locale; unsupported values resolve to {@link DEFAULT_LOCALE}. */
  locale: string;
  /** Full resource tree (namespaces per locale). */
  resources: LocaleResources;
  /** Namespace used when a key omits one. Defaults to `common`. */
  defaultNS?: string;
};

/**
 * Build an isolated translator over a fresh i18next instance: no global
 * singleton, no React, synchronous init. Missing keys fall back to the
 * English value; unsupported locales resolve to {@link DEFAULT_LOCALE}.
 */
export function createTranslator(input: CreateTranslatorInput): Translator {
  const locale: Locale = isSupportedLocale(input.locale)
    ? input.locale
    : DEFAULT_LOCALE;
  const defaultNS = input.defaultNS ?? "common";
  const instance = i18next.createInstance();
  void instance.init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    resources: input.resources,
    ns: Object.keys(input.resources[DEFAULT_LOCALE] ?? {}),
    defaultNS,
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  });
  return {
    locale,
    instance,
    t: (key, params) => instance.t(key, params ?? {}) as string,
  };
}
