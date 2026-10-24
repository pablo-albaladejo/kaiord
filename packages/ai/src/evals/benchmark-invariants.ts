import type { Benchmark, ZoneCheck } from "./types";

/**
 * Structural invariants the benchmark fixtures must satisfy. The suites that
 * consume them cannot run in this project, so these are the only assertions the
 * fixtures ever face: they are a specification, and this checks the
 * specification.
 *
 * The zone rule exists because a bound that cannot discriminate asserts nothing
 * while looking like an assertion. `checkZones` compares against
 * `bound * (1 ± ZONE_TOLERANCE)`, and targets are non-negative, so a declared
 * `0` degenerates in both directions: as a minimum the test is `min < 0`, which
 * no target can trigger; as a maximum it is `max > 0`, which every positive
 * target triggers. Neither separates a good answer from a bad one.
 */
const usableBound = (value: number | undefined): boolean =>
  value !== undefined && Number.isFinite(value) && value !== 0;

/** `basis` qualifies only a power `range`; anywhere else core would strip it. */
const basisViolation = (zc: ZoneCheck): string | null => {
  if (zc.basis === undefined) return null;
  if (zc.unit !== undefined && zc.unit !== "range") {
    return `zoneCheck for "${zc.targetType}" declares basis ${zc.basis} with unit ${zc.unit}, but basis qualifies only a range`;
  }
  return zc.targetType === "power"
    ? null
    : `zoneCheck for "${zc.targetType}" declares basis ${zc.basis}, but basis qualifies only a power target`;
};

export const zoneCheckViolation = (zc: ZoneCheck): string | null => {
  const basis = basisViolation(zc);
  if (basis !== null) return basis;
  if (usableBound(zc.minValue) || usableBound(zc.maxValue)) return null;
  const declared = [
    zc.minValue === undefined ? null : `minValue=${zc.minValue}`,
    zc.maxValue === undefined ? null : `maxValue=${zc.maxValue}`,
  ].filter((s): s is string => s !== null);
  return declared.length === 0
    ? `zoneCheck for "${zc.targetType}" declares no bound, so its comparisons are unreachable`
    : `zoneCheck for "${zc.targetType}" declares ${declared.join(", ")}, which the comparison cannot use`;
};

/**
 * A range cannot be required of a generation that was never given the zones
 * to resolve one: zone references would stay zones, and the case would be red
 * by construction rather than by the model.
 */
export const targetCheckViolation = (b: Benchmark): string | null => {
  const check = b.targetCheck;
  if (!check?.requireRange) return null;
  const table = b.athleteZones?.[check.targetType];
  return table && table.length > 0
    ? null
    : `targetCheck requires ${check.targetType} ranges but athleteZones has no ${check.targetType} table`;
};

export const benchmarkViolations = (
  benchmarks: readonly Benchmark[]
): string[] =>
  benchmarks.flatMap((b) => {
    const violations = [
      b.zoneCheck ? zoneCheckViolation(b.zoneCheck) : null,
      targetCheckViolation(b),
    ].filter((v): v is string => v !== null);
    return violations.map((v) => `${b.id}: ${v}`);
  });
