export type ZoneCheck = {
  targetType: string;
  minPercent?: number;
  maxPercent?: number;
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

export type EvalResult = {
  id: string;
  pass: boolean;
  errors: Array<string>;
  sport?: string;
  stepCount?: number;
  durationMs: number;
};

export type EvalReport = {
  provider: string;
  model: string;
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  results: Array<EvalResult>;
  byCategory: Record<string, { total: number; passed: number }>;
  byLanguage: Record<string, { total: number; passed: number }>;
};
