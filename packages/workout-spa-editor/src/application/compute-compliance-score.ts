/**
 * Pure compliance-score derivation: how close was the actual session to
 * the planned duration?
 *
 * Returns null when either side is missing, when planDur is 0, or on NaN —
 * all "score is unknown" cases. Otherwise clamps to `[0, 1]` so the
 * UI bucket mapping is deterministic.
 *
 * The score is symmetric: a 30-min execution of a 60-min plan and a
 * 90-min execution of the same plan both score 0.5. Direction-aware
 * scoring is a follow-up; v1 documents the symmetry as a known limit.
 */

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export function computeComplianceScore(
  planDur: number | undefined,
  actualDur: number | undefined
): number | null {
  if (planDur === undefined || actualDur === undefined) return null;
  if (planDur === 0) return null;
  if (Number.isNaN(planDur) || Number.isNaN(actualDur)) return null;
  return clamp01(1 - Math.abs(planDur - actualDur) / planDur);
}
