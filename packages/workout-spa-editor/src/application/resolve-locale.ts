/**
 * Resolve the active UI locale from the stored preference and the browser
 * language. An explicit `en`/`es` preference wins; `auto` (or an absent
 * preference) derives from `navigatorLanguage` (`es*` → `es`, otherwise `en`).
 */

import { type Locale, normalizeLocale } from "@kaiord/i18n";

import type { LocalePreference } from "../types/user-preferences";

export function resolveLocale(
  preference: LocalePreference | undefined,
  navigatorLanguage: string
): Locale {
  if (preference === "en" || preference === "es") return preference;
  return normalizeLocale(navigatorLanguage);
}
