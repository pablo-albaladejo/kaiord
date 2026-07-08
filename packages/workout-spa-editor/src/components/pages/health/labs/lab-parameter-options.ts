/**
 * Catalog options for the parameter autocomplete, plus the small text
 * utilities the entry form needs: a stable `"Name (ABBREV)"` label per
 * option (localized), reverse label -> parameter lookup, unit choices for
 * one parameter, and a slug builder for free `custom:<slug>` parameters.
 */
import { LAB_PARAMETER_CATALOG, type LabParameter } from "@kaiord/core";
import type { Locale } from "@kaiord/i18n";

import {
  formatLabParameterLabel,
  getLabParameterDisplay,
} from "./lab-parameter-display";

export type LabParameterOption = { key: string; label: string };

const labelFor = (p: LabParameter, locale: Locale): string => {
  const display = getLabParameterDisplay(p.key, locale);
  return display ? formatLabParameterLabel(display) : p.key;
};

/** Autocomplete options for the active locale, sorted by localized label. */
export function labParameterOptions(
  locale: Locale = "en"
): readonly LabParameterOption[] {
  return LAB_PARAMETER_CATALOG.map((p) => ({
    key: p.key,
    label: labelFor(p, locale),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

/** Resolve a typed/selected catalog label back to its parameter (exact match only). */
export function findParameterByLabel(
  label: string,
  locale: Locale = "en"
): LabParameter | undefined {
  const target = label.trim();
  return LAB_PARAMETER_CATALOG.find((p) => labelFor(p, locale) === target);
}

/** Unit choices for one parameter: canonical first, then its known alternates. */
export function unitOptionsFor(param: LabParameter): readonly string[] {
  return [param.canonicalUnit, ...(param.knownUnits ?? []).map((u) => u.unit)];
}

/** Slugify a free-text parameter name into a stable `custom:<slug>` key body. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
