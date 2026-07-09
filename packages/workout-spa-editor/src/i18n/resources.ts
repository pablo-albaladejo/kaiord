/**
 * SPA i18n resource registry, discovered from `locales/<locale>/<ns>.json`.
 *
 * English is bundled eagerly — it is the synchronous source-of-truth, the
 * fallback for every missing key/locale, and the default that keeps the
 * thousands of unwrapped component tests rendering in `en`. Every other locale
 * is code-split and pulled in on demand by `loadLocaleNamespaces`, so a catalog
 * of N languages ships only English plus the active locale's chunk — never all
 * of them.
 *
 * Add a namespace: drop `locales/<locale>/<name>.json`. Add a language: drop a
 * `locales/<locale>/` folder. Neither requires editing this file.
 */

import {
  DEFAULT_LOCALE,
  type Locale,
  type LocaleNamespaces,
  type NamespaceDictionary,
} from "@kaiord/i18n";

export const DEFAULT_NAMESPACE = "common";

const EN_MODULES = import.meta.glob<NamespaceDictionary>(
  "./locales/en/*.json",
  { eager: true, import: "default" }
);

const LOCALE_MODULES = import.meta.glob<NamespaceDictionary>(
  "./locales/*/*.json",
  { import: "default" }
);

const namespaceOf = (path: string): string =>
  path.slice(path.lastIndexOf("/") + 1, -".json".length);

const localeOf = (path: string): string => {
  const dir = path.slice(0, path.lastIndexOf("/"));
  return dir.slice(dir.lastIndexOf("/") + 1);
};

/** The eager, always-bundled English catalog: fallback and test default. */
export const DEFAULT_CATALOG: LocaleNamespaces = Object.fromEntries(
  Object.entries(EN_MODULES).map(([path, dict]) => [namespaceOf(path), dict])
);

const cache: Partial<Record<Locale, LocaleNamespaces>> = {
  [DEFAULT_LOCALE]: DEFAULT_CATALOG,
};

/** Namespace list for i18next, derived from the eager English catalog. */
export const NAMESPACES = Object.keys(DEFAULT_CATALOG);

/** Already-loaded namespaces for a locale, or `undefined` if not yet loaded. */
export const getLocaleNamespaces = (
  locale: Locale
): LocaleNamespaces | undefined => cache[locale];

/** Code-split-load and cache a locale's namespaces (no-op once cached). */
export const loadLocaleNamespaces = async (
  locale: Locale
): Promise<LocaleNamespaces> => {
  const cached = cache[locale];
  if (cached) return cached;
  const entries = Object.entries(LOCALE_MODULES).filter(
    ([path]) => localeOf(path) === locale
  );
  const loaded = await Promise.all(
    entries.map(
      async ([path, load]) => [namespaceOf(path), await load()] as const
    )
  );
  const namespaces = Object.fromEntries(loaded);
  cache[locale] = namespaces;
  return namespaces;
};
