/**
 * Maps a compliance score to a visual bucket. Owned by the SPA's
 * presentation layer because the bucket name drives a CSS class —
 * the underlying score itself is platform-agnostic and lives in
 * `compute-compliance-score.ts`.
 *
 * Boundary rule: closed-on-the-low-side, open-on-the-high-side
 * `[0, 0.5) amber`, `[0.5, 0.8) mid`, `[0.8, 1.0] emerald`.
 *
 * Out-of-range inputs clamp to the nearest finite bucket; NaN is
 * treated as missing data (neutral). Defensive contract for future
 * scoring formulas (zones, TSS) that may produce values outside `[0, 1]`.
 */

export type ComplianceBucket = "neutral" | "amber" | "mid" | "emerald";

export function complianceBucket(score: number | null): ComplianceBucket {
  if (score === null || Number.isNaN(score)) return "neutral";
  if (score < 0.5) return "amber";
  if (score < 0.8) return "mid";
  return "emerald";
}
