/**
 * resolveWhoopLabParameterKey — maps one WHOOP biomarker (slug + display
 * name) to a KAIORD lab parameter key: an exact catalog-key match on the
 * slug, else a case-insensitive match of the display name against the
 * catalog's English name, else a free `custom:<slug>` key for the long tail.
 * Mirrors `components/pages/health/labs/map-extraction-to-draft.ts`'s
 * AI-extraction resolution, kept as an independent implementation here since
 * `application/*` must not depend on the `components/*` presentation layer.
 */
import {
  customParameterKey,
  getLabParameter,
  LAB_PARAMETER_CATALOG,
} from "@kaiord/core";

import enLabNames from "../../i18n/locales/en/labs.json";

const NAMES: Record<string, string> = enLabNames;

const findKeyByDisplayName = (displayName: string): string | undefined => {
  const target = displayName.trim().toLowerCase();
  return LAB_PARAMETER_CATALOG.find(
    (parameter) => NAMES[parameter.key]?.toLowerCase() === target
  )?.key;
};

export const resolveWhoopLabParameterKey = (
  slug: string,
  displayName: string | null | undefined
): string => {
  if (getLabParameter(slug)) return slug;
  const byLabel = displayName ? findKeyByDisplayName(displayName) : undefined;
  return byLabel ?? customParameterKey(slug);
};
