/**
 * The SPA's react-i18next instance. English is the source-of-truth and
 * fallback locale; missing keys render the English value. The active locale
 * is driven by the persisted user preference (see `useLocaleSync`), never by
 * i18next language detection.
 */

import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_NAMESPACE, NAMESPACES, resources } from "./resources";

export const appI18n = i18next.createInstance();

void appI18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources,
  ns: [...NAMESPACES],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
});

/**
 * Switch the active locale and reflect it on `<html lang>`. No-op when the
 * locale is already active. Called from the preference-sync effect.
 */
export function setActiveLocale(locale: Locale): void {
  if (appI18n.language !== locale) {
    void appI18n.changeLanguage(locale);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}
