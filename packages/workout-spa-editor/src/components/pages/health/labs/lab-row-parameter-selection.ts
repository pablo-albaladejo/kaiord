/**
 * Identity transitions that need the parameter catalog: picking a catalog
 * parameter auto-fills its canonical unit and the sex-aware catalog ref
 * range (editable, `refTouched: false` until the user changes it); typing a
 * custom name derives the free `custom:<slug>` key.
 */
import {
  type BiologicalSex,
  customParameterKey,
  type LabParameter,
} from "@kaiord/core";

import { resolveCatalogRefRange } from "../../../../application/lab/resolve-catalog-ref-range";
import { slugify } from "./lab-parameter-options";
import type { LabRowState } from "./lab-row-model";

const rangeToStrings = (
  range: { low?: number; high?: number } | undefined
) => ({
  refLowRaw: range?.low != null ? String(range.low) : "",
  refHighRaw: range?.high != null ? String(range.high) : "",
});

export const selectCatalogParameter = (
  row: LabRowState,
  label: string,
  param: LabParameter | undefined,
  sex: BiologicalSex | undefined
): LabRowState => {
  if (!param) return { ...row, catalogLabel: label, parameterKey: "" };
  return {
    ...row,
    catalogLabel: label,
    parameterKey: param.key,
    unitRaw: param.canonicalUnit,
    refTouched: false,
    ...rangeToStrings(resolveCatalogRefRange(param, sex)),
  };
};

export const setCustomName = (row: LabRowState, name: string): LabRowState => ({
  ...row,
  customName: name,
  parameterKey: name.trim() ? customParameterKey(slugify(name)) : "",
});
