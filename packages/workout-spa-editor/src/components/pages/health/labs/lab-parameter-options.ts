/**
 * Catalog options for the parameter autocomplete, plus the small text
 * utilities the entry form needs: a stable `"Name (ABBREV)"` label per
 * option (from the English display map), reverse label -> parameter lookup,
 * unit choices for one parameter, and a slug builder for free
 * `custom:<slug>` parameters.
 */
import { LAB_PARAMETER_CATALOG, type LabParameter } from "@kaiord/core";

import {
  formatLabParameterLabel,
  getLabParameterDisplay,
} from "./lab-parameter-display";

export type LabParameterOption = { key: string; label: string };

const labelFor = (p: LabParameter): string => {
  const display = getLabParameterDisplay(p.key);
  return display ? formatLabParameterLabel(display) : p.key;
};

export const LAB_PARAMETER_OPTIONS: readonly LabParameterOption[] =
  LAB_PARAMETER_CATALOG.map((p) => ({ key: p.key, label: labelFor(p) })).sort(
    (a, b) => a.label.localeCompare(b.label)
  );

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
