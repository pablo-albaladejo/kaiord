/**
 * Name of the first-run default profile in the browser's language
 * ("My profile" / "Mi perfil"). Bundled per locale instead of read from the
 * code-split catalogs: it is needed while the database opens, with every
 * other database operation held behind it, so it must never wait on a
 * network fetch.
 */

import type { Locale } from "@kaiord/i18n";

import { resolveLocale } from "../application/resolve-locale";

export const DEFAULT_PROFILE_NAMES: Readonly<Record<Locale, string>> = {
  en: "My profile",
  es: "Mi perfil",
};

export const defaultProfileName = (navigatorLanguage: string): string =>
  DEFAULT_PROFILE_NAMES[resolveLocale(undefined, navigatorLanguage)];
