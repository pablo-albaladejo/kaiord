/**
 * Supported UI locales. English is the source-of-truth catalog and the
 * terminal element of the fallback chain (see `create-translator`).
 */
export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Source-of-truth locale; also the fallback when a key or locale is missing. */
export const DEFAULT_LOCALE: Locale = "en";

/** A namespace dictionary: nested string leaves keyed by dot-free segments. */
export type NamespaceDictionary = {
  [key: string]: string | NamespaceDictionary;
};

/** All namespaces for one locale, keyed by namespace name. */
export type LocaleNamespaces = Record<string, NamespaceDictionary>;

/** Full resource tree: namespaces per locale. Mirrors i18next's resource shape. */
export type LocaleResources = Record<Locale, LocaleNamespaces>;

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Coerce any BCP-47 tag (or bare language) to a supported locale by
 * language-prefix match: `es`, `es-ES`, `es-419` → `es`; everything else
 * (including `en`, `fr`, empty) → the default (`en`). Never throws.
 */
export function normalizeLocale(tag: string): Locale {
  return tag.toLowerCase().startsWith("es") ? "es" : DEFAULT_LOCALE;
}
