import type { KnownUnit, LabParameter } from "./lab-parameter";

export type AffineUnit = {
  factorToCanonical: number;
  offsetToCanonical?: number;
};

/** valueCanonical = valueRaw × factor + offset (offset defaults to 0). */
export function toCanonicalValue(valueRaw: number, unit: AffineUnit): number {
  return valueRaw * unit.factorToCanonical + (unit.offsetToCanonical ?? 0);
}

/** Inverse of {@link toCanonicalValue}: valueRaw = (canonical − offset) / factor. */
export function fromCanonicalValue(
  valueCanonical: number,
  unit: AffineUnit
): number {
  return (
    (valueCanonical - (unit.offsetToCanonical ?? 0)) / unit.factorToCanonical
  );
}

/**
 * Resolve the affine transform for `unitRaw` on a parameter. The canonical
 * unit maps to identity (factor 1). A free parameter (`param` undefined) or an
 * unrecognized unit returns `null`, signalling passthrough (no conversion).
 */
export function resolveAffineUnit(
  param: LabParameter | undefined,
  unitRaw: string
): AffineUnit | null {
  if (!param) return null;
  if (unitRaw === param.canonicalUnit) return { factorToCanonical: 1 };
  const known: KnownUnit | undefined = (param.knownUnits ?? []).find(
    (u) => u.unit === unitRaw
  );
  if (!known) return null;
  return {
    factorToCanonical: known.factorToCanonical,
    offsetToCanonical: known.offsetToCanonical,
  };
}

export type CanonicalMeasurement = {
  valueCanonical: number;
  unitCanonical: string;
};

/** Convert an entered value to canonical, passing through when unresolvable. */
export function convertMeasurement(
  param: LabParameter | undefined,
  valueRaw: number,
  unitRaw: string
): CanonicalMeasurement {
  const affine = param ? resolveAffineUnit(param, unitRaw) : null;
  if (!param || !affine) {
    return { valueCanonical: valueRaw, unitCanonical: unitRaw };
  }
  return {
    valueCanonical: toCanonicalValue(valueRaw, affine),
    unitCanonical: param.canonicalUnit,
  };
}

/** Convert an optional reference bound with the same affine transform. */
export function convertBound(
  param: LabParameter | undefined,
  bound: number | undefined,
  unitRaw: string
): number | undefined {
  if (bound == null) return undefined;
  const affine = resolveAffineUnit(param, unitRaw);
  return affine ? toCanonicalValue(bound, affine) : bound;
}
