/**
 * The SPA's react-i18next instance. English is the source-of-truth and
 * fallback locale and the only catalog bundled at init; every other locale is
 * code-split and registered on first switch (see `setActiveLocale`). The
 * active locale is driven by the persisted user preference (see
 * `LocaleProvider`), never by i18next language detection.
 */

import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import {
  DEFAULT_CATALOG,
  DEFAULT_NAMESPACE,
  loadLocaleNamespaces,
  NAMESPACES,
} from "./resources";

export const appI18n = i18next.createInstance();

void appI18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: { [DEFAULT_LOCALE]: DEFAULT_CATALOG },
  ns: [...NAMESPACES],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
});

const registerBundle = (
  locale: Locale,
  namespaces: Record<string, unknown>
): void => {
  for (const [ns, dict] of Object.entries(namespaces)) {
    appI18n.addResourceBundle(locale, ns, dict, true, true);
  }
};

/**
 * Load (if needed), register, and activate a locale, reflecting it on
 * `<html lang>`. Resolves once the locale's catalog is live, so callers can
 * flip the UI atomically. No-op when the locale is already active.
 */
export async function setActiveLocale(locale: Locale): Promise<void> {
  if (
    locale !== DEFAULT_LOCALE &&
    !appI18n.hasResourceBundle(locale, DEFAULT_NAMESPACE)
  ) {
    registerBundle(locale, await loadLocaleNamespaces(locale));
  }
  if (appI18n.language !== locale) {
    await appI18n.changeLanguage(locale);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}
