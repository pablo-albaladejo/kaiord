/**
 * resolveEffectiveRefRange — the effective reference range for one entered
 * row: the report's own bounds when the user touched the ref fields
 * (`refSource: "report"`), else the catalog's sex-aware fallback
 * (`refSource: "catalog"`), else none. `refLowCanonical`/`refHighCanonical`
 * always carry the EFFECTIVE bounds (report or catalog) so F4's chart band
 * can read them straight off the stored `LabValue` — only the raw
 * `refLow`/`refHigh` are report-only (never the catalog fallback).
 */
import {
  type BiologicalSex,
  convertBound,
  type LabParameter,
  type LabRefSource,
} from "@kaiord/core";

import { parseOptionalNumber } from "./parse-optional-number";
import { resolveCatalogRefRange } from "./resolve-catalog-ref-range";

export type EffectiveRefRange = {
  refLow?: number;
  refHigh?: number;
  refLowCanonical?: number;
  refHighCanonical?: number;
  refSource: LabRefSource;
};

export type RefRangeRowInput = {
  refLowRaw: string;
  refHighRaw: string;
  refTouched: boolean;
  unitRaw: string;
};

export function resolveEffectiveRefRange(
  param: LabParameter | undefined,
  row: RefRangeRowInput,
  sex: BiologicalSex | undefined
): EffectiveRefRange {
  const reportLow = parseOptionalNumber(row.refLowRaw);
  const reportHigh = parseOptionalNumber(row.refHighRaw);
  if (row.refTouched && (reportLow != null || reportHigh != null)) {
    return {
      refLow: reportLow,
      refHigh: reportHigh,
      refLowCanonical: convertBound(param, reportLow, row.unitRaw),
      refHighCanonical: convertBound(param, reportHigh, row.unitRaw),
      refSource: "report",
    };
  }
  const fallback = param ? resolveCatalogRefRange(param, sex) : undefined;
  if (!fallback) return { refSource: "none" };
  return {
    refLowCanonical: fallback.low,
    refHighCanonical: fallback.high,
    refSource: "catalog",
  };
}
