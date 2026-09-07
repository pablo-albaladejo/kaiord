import type { Benchmark, ZoneCheck } from "./types";

/**
 * Structural invariants the benchmark fixtures must satisfy. The suites that
 * consume them cannot run in this project, so these are the only assertions the
 * fixtures ever face: they are a specification, and this checks the
 * specification.
 *
 * The zone rule exists because a bound the reading comparison skips asserts
 * nothing while looking like an assertion. `checkZones` guards on
 * `zc.minValue &&` / `zc.maxValue &&`, so a bound must be present AND usable —
 * a declared `0` reads as absent there.
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
