/**
 * Name of the first-run default profile in the browser's language
 * ("My profile" / "Mi perfil"). Non-English catalogs are code-split, so the
 * name may need their chunk; any failure falls back to the bundled English.
 */

import { DEFAULT_LOCALE } from "@kaiord/i18n";

import { resolveLocale } from "../application/resolve-locale";
import { appI18n } from "./i18n";
import { loadLocaleNamespaces } from "./resources";

const englishName = (): string =>
  appI18n.t("athlete:defaultProfile.name", { lng: DEFAULT_LOCALE });

type AthleteCatalog = { defaultProfile?: { name?: string } } | undefined;

export const defaultProfileName = async (
  navigatorLanguage: string
): Promise<string> => {
  const locale = resolveLocale(undefined, navigatorLanguage);
  if (locale === DEFAULT_LOCALE) return englishName();
  try {
    const catalog = await loadLocaleNamespaces(locale);
    const athlete = catalog.athlete as AthleteCatalog;
    return athlete?.defaultProfile?.name ?? englishName();
  } catch {
    return englishName();
  }
};
