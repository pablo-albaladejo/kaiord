export type ZoneCheck = {
  targetType: string;
  minValue?: number;
  maxValue?: number;
};

export type Benchmark = {
  id: string;
  text: string;
  expectedSport?: string;
  minSteps: number;
  maxSteps: number;
  category: string;
  language: string;
  zoneCheck?: ZoneCheck;
};

/** The capability a failure is attributed to, so a red result says which one. */
export type EvalDimension = "schema" | "sport" | "steps" | "zone" | "run";

/**
 * What one dimension produced for one benchmark.
 *
 * `unmeasured` is a MEMBER OF THE UNION, not a boolean beside a score, and it
 * carries a reason instead of a message. That shape is the point: there is no
 * field on it a caller could average, sum or compare, so a criterion nobody
 * measured cannot enter a rate by looking like a zero. The compiler finds
 * every site that assumes otherwise.
 */
export type DimensionOutcome =
  | { dimension: EvalDimension; status: "passed" }
  | { dimension: EvalDimension; status: "failed"; message: string }
  | { dimension: EvalDimension; status: "unmeasured"; reason: string };

/**
 * Counts reported as a pair, never as a lone rate: `passed` is meaningless
 * without the `measured` it is out of, and a dimension with `measured: 0` has
 * no rate at all — not 0%, not 100%.
 */
export type DimensionTally = {
  measured: number;
  passed: number;
  unmeasured: number;
  /** Distinct reasons, so an unmeasured dimension reports why, not just how many. */
  reasons: Array<string>;
};

/** The shape the reporter consumes, shared by every suite that reports. */
export type ReportableResult = {
  id: string;
  pass: boolean;
  errors: Array<string>;
  durationMs: number;
};

export type EvalResult = ReportableResult & {
  /** One entry per dimension, including the ones nothing measured. */
  outcomes: Array<DimensionOutcome>;
  sport?: string;
  stepCount?: number;
};

/**
 * Generic over the result shape so the declared type matches what the runner
 * actually serializes: the reporter reads only `ReportableResult` fields, but
 * it stores whatever it was handed, and the saved JSON carries the richer
 * per-suite fields (`failures`, `harnessFault`) that make a red run readable.
 */
export type EvalReport<R extends ReportableResult = ReportableResult> = {
  provider: string;
  model: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  /**
   * Scale in the name, and unrounded: a display concern and a comparison
   * concern must not share one field. `Math.round` here once made 89.6% read
   * as 90, which is the wrong side of a 90 floor.
   */
  passRatePercent: number;
  results: Array<R>;
  byCategory: Record<string, { total: number; passed: number }>;
  byLanguage: Record<string, { total: number; passed: number }>;
  /** Absent for suites whose results carry no per-dimension outcomes. */
  byDimension?: Record<string, DimensionTally>;
};
