/**
 * Pure, locale-aware copy for upstream failures. Localizes by the stable
 * `ValidationError.code` (never by message text); an absent or unmapped code
 * falls back to the upstream English `message`. Reads the `errors` dictionary
 * directly (no react-i18next), so it defaults to English outside a provider
 * and keeps `en`-mode assertions unchanged.
 */
import type { Locale } from "@kaiord/i18n";

import enErrors from "./locales/en/errors.json";
import esErrors from "./locales/es/errors.json";

const ERRORS: Record<Locale, typeof enErrors> = {
  en: enErrors,
  es: esErrors,
};

/** Localized "Validation errors:" heading for the active locale. */
export const validationHeading = (locale: Locale = "en"): string =>
  ERRORS[locale].validationHeading;

/**
 * Localized copy for a validation error by stable code, falling back to the
 * upstream English message when the code is absent or has no mapping.
 */
export function localizeValidationMessage(
  entry: { code?: string; message: string },
  locale: Locale = "en"
): string {
  if (!entry.code) return entry.message;
  const table = ERRORS[locale].validation as Record<string, string>;
  const enTable = ERRORS.en.validation as Record<string, string>;
  return table[entry.code] ?? enTable[entry.code] ?? entry.message;
}
