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

export type EvalFailure = {
  dimension: EvalDimension;
  message: string;
};

/** The shape the reporter consumes, shared by every suite that reports. */
export type ReportableResult = {
  id: string;
  pass: boolean;
  errors: Array<string>;
  durationMs: number;
};

export type EvalResult = ReportableResult & {
  /** Same failures as `errors`, each carrying the dimension that produced it. */
  failures: Array<EvalFailure>;
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
  passRate: number;
  results: Array<R>;
  byCategory: Record<string, { total: number; passed: number }>;
  byLanguage: Record<string, { total: number; passed: number }>;
};
