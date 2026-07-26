import { type Locale, normalizeLocale } from "@kaiord/i18n";

/**
 * Resolve the active CLI locale from the environment. An explicit
 * `KAIORD_LANG` override wins (used for tests and forcing a language);
 * otherwise the standard POSIX locale chain is consulted. Any value is
 * coerced to a supported locale (`en` or `es`) via `normalizeLocale`.
 */
export const resolveCliLocale = (
  env: NodeJS.ProcessEnv = process.env
): Locale => {
  const override = env.KAIORD_LANG?.trim();
  if (override) {
    return normalizeLocale(override);
  }
  const source =
    env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE || "";
  return normalizeLocale(source);
};
