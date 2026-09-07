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

export const zoneCheckViolation = (zc: ZoneCheck): string | null => {
  if (usableBound(zc.minValue) || usableBound(zc.maxValue)) return null;
  const declared = [
    zc.minValue === undefined ? null : `minValue=${zc.minValue}`,
    zc.maxValue === undefined ? null : `maxValue=${zc.maxValue}`,
  ].filter((s): s is string => s !== null);
  return declared.length === 0
    ? `zoneCheck for "${zc.targetType}" declares no bound, so its comparisons are unreachable`
    : `zoneCheck for "${zc.targetType}" declares ${declared.join(", ")}, which the comparison cannot use`;
};

export const benchmarkViolations = (
  benchmarks: readonly Benchmark[]
): string[] =>
  benchmarks.flatMap((b) => {
    if (!b.zoneCheck) return [];
    const violation = zoneCheckViolation(b.zoneCheck);
    return violation === null ? [] : [`${b.id}: ${violation}`];
  });
