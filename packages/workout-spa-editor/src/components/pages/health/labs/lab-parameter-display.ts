/**
 * Presentation-layer display text for the language-agnostic core lab catalog.
 * Names come from the i18n `labs` dictionary (en/es), keyed by
 * `LabParameter.key`; clinical abbreviations are language-neutral and shared.
 * Domain `core` carries only identity + objective data.
 */
import type { Locale } from "@kaiord/i18n";

import enLabs from "../../../../i18n/locales/en/labs.json";
import esLabs from "../../../../i18n/locales/es/labs.json";
import { LAB_ABBREVIATIONS } from "./lab-abbreviations";

export type LabParameterDisplay = { name: string; abbrev: string };

const NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  en: enLabs,
  es: esLabs,
};

/** Keys the display map covers — used to guard catalog/display parity. */
export const LAB_PARAMETER_DISPLAY_KEYS: readonly string[] =
  Object.keys(enLabs);

/** Stable `"Name (ABBREV)"` label from a display descriptor. */
export const formatLabParameterLabel = (d: LabParameterDisplay): string =>
  `${d.name} (${d.abbrev})`;

/**
 * Localized display (name + language-neutral abbrev) for a core parameter
 * key. Defaults to English; a missing localized name falls back to English.
 */
export function getLabParameterDisplay(
  key: string,
  locale: Locale = "en"
): LabParameterDisplay | undefined {
  const name = NAMES_BY_LOCALE[locale][key] ?? NAMES_BY_LOCALE.en[key];
  const abbrev = LAB_ABBREVIATIONS[key];
  if (name === undefined || abbrev === undefined) return undefined;
  return { name, abbrev };
}
