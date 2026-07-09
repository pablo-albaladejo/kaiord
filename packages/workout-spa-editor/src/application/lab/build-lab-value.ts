/**
 * buildLabValue — assemble one persistable `LabValue` from a form row, or
 * `undefined` when the row carries no usable measurement (blank rows are
 * silently skipped, not saved). Canonical value conversion goes through the
 * core affine converter (C1/CAMBIO 2); the effective reference range is
 * resolved by `resolveEffectiveRefRange`; the flag is always computed in
 * canonical unit via `computeFlag`.
 */
import {
  type BiologicalSex,
  computeFlag,
  convertMeasurement,
  getLabParameter,
  isCustomParameterKey,
  type LabValue,
} from "@kaiord/core";

import type { LabProvenanceSource } from "./build-lab-report";
import { parseOptionalNumber } from "./parse-optional-number";
import { resolveEffectiveRefRange } from "./resolve-effective-ref-range";

export type LabValueRowInput = {
  parameterKey: string;
  valueRaw: string;
  unitRaw: string;
  refLowRaw: string;
  refHighRaw: string;
  refTouched: boolean;
};

export type BuildLabValueContext = {
  id: string;
  profileId: string;
  reportId: string;
  date: string;
  sex?: BiologicalSex;
  provenance?: LabProvenanceSource;
};

export function buildLabValue(
  row: LabValueRowInput,
  ctx: BuildLabValueContext
): LabValue | undefined {
  const valueRaw = parseOptionalNumber(row.valueRaw);
  const hasParameter = row.parameterKey.trim() !== "";
  const hasUnit = row.unitRaw.trim() !== "";
  if (!hasParameter || valueRaw == null || !hasUnit) return undefined;

  const param = isCustomParameterKey(row.parameterKey)
    ? undefined
    : getLabParameter(row.parameterKey);
  const { valueCanonical, unitCanonical } = convertMeasurement(
    param,
    valueRaw,
    row.unitRaw
  );
  const range = resolveEffectiveRefRange(param, row, ctx.sex);
  const flag = computeFlag({
    valueCanonical,
    refLowCanonical: range.refLowCanonical,
    refHighCanonical: range.refHighCanonical,
  });

  return {
    id: ctx.id,
    profileId: ctx.profileId,
    reportId: ctx.reportId,
    parameterKey: row.parameterKey,
    date: ctx.date,
    valueRaw,
    unitRaw: row.unitRaw,
    valueCanonical,
    unitCanonical,
    ...range,
    flag,
    provenance: { source: ctx.provenance ?? "manual" },
  };
}
