/**
 * Catalog options for the parameter autocomplete, plus the small text
 * utilities the entry form needs: a stable `"nameES (ABBREV)"` label per
 * option, reverse label -> parameter lookup, unit choices for one
 * parameter, and a slug builder for free `custom:<slug>` parameters.
 */
import { LAB_PARAMETER_CATALOG, type LabParameter } from "@kaiord/core";

export type LabParameterOption = { key: string; label: string };

const labelFor = (p: LabParameter): string => `${p.nameES} (${p.abbrev})`;

export const LAB_PARAMETER_OPTIONS: readonly LabParameterOption[] = [
  ...LAB_PARAMETER_CATALOG,
]
  .sort((a, b) => a.nameES.localeCompare(b.nameES))
  .map((p) => ({ key: p.key, label: labelFor(p) }));

const BY_LABEL: ReadonlyMap<string, LabParameter> = new Map(
  LAB_PARAMETER_CATALOG.map((p) => [labelFor(p), p])
);

/** Resolve a typed/selected catalog label back to its parameter (exact match only). */
export function findParameterByLabel(label: string): LabParameter | undefined {
  return BY_LABEL.get(label.trim());
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
