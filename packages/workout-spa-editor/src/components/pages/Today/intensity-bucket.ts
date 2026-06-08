/** Coarse, ordinal intensity buckets for the Daily WeekStrip mark. */
export type IntensityBucket = "easy" | "moderate" | "hard";

const EASY_MAX = 40;
const MODERATE_MAX = 80;
const RANK: Record<IntensityBucket, number> = { easy: 0, moderate: 1, hard: 2 };

export const maxBucket = (
  a: IntensityBucket,
  b: IntensityBucket
): IntensityBucket => (RANK[a] >= RANK[b] ? a : b);

export const tssBucket = (tss: number): IntensityBucket =>
  tss < EASY_MAX ? "easy" : tss <= MODERATE_MAX ? "moderate" : "hard";

export const effortBucket = (effort: number): IntensityBucket =>
  effort <= 2 ? "easy" : effort === 3 ? "moderate" : "hard";
